const express = require("express");
const { ethers } = require("ethers");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { Offchain, SchemaEncoder } = require("@ethereum-attestation-service/eas-sdk");
require("dotenv").config();

// BigInt serialization fix
BigInt.prototype.toJSON = function () { return this.toString(); };

let db;
(async () => {
    db = await open({
        filename: "./racepass.db",
        driver: sqlite3.Database
    });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            address TEXT PRIMARY KEY,
            token_id TEXT,
            issued_at DATETIMEDEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tickets (
            ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_address TEXT,
            tx_hash TEXT,
            minted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS reputation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id TEXT,
            amount INTEGER,
            type TEXT,
            reason TEXT,
            tx_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS attestations (
            uid TEXT PRIMARY KEY,
            recipient TEXT,
            event_name TEXT,
            reputation_value INTEGER,
            signature_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("SQLite Database initialized.");
})();

// Contract Artifacts (built by Hardhat)
const IdentityArtifact = require("./artifacts/contracts/RacePassIdentity.sol/RacePassIdentity.json");
const TicketArtifact = require("./artifacts/contracts/RacePassTicket.sol/RacePassTicket.json");

const app = express();
app.use(cors());
app.use(express.json());

// CONFIG
const RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY;
const IDENTITY_ADDRESS = "0xF6B60D212abd955a6d4937535f89B5B7b6426C47";
const TICKET_ADDRESS = "0xeb52e2394ECFbAbFD53F9cF9e50F8c4bC35d84e2";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const identityContract = new ethers.Contract(IDENTITY_ADDRESS, IdentityArtifact.abi, wallet);
const ticketContract = new ethers.Contract(TICKET_ADDRESS, TicketArtifact.abi, wallet);

// EAS config for off-chain 
const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Standard Sepolia address functioning as domain separator
const offchain = new Offchain(
    {
        address: EASContractAddress,
        version: "0.26",
        chainId: 10143 // Monad testnet
    },
    1
);
const schemaEncoder = new SchemaEncoder("string eventName, uint256 reputationValue");
const schemaUID = "0x1234567812345678123456781234567812345678123456781234567812345678"; // Generic string

// --- EAS ATTESTATION ENDPOINT ---

app.post("/api/attest/issue", async (req, res) => {
    try {
        const { recipient, eventName, reputationValue } = req.body;
        console.log(`Issuing EAS Offchain Attestation to ${recipient} for ${eventName}`);

        // Encode the data
        const encodedData = schemaEncoder.encodeData([
            { name: "eventName", value: eventName, type: "string" },
            { name: "reputationValue", value: reputationValue, type: "uint256" }
        ]);

        // Sign the attestation with the backend wallet
        const attestation = await offchain.signOffchainAttestation(
            {
                recipient: recipient,
                expirationTime: 0n, // never expires
                time: BigInt(Math.floor(Date.now() / 1000)),
                revocable: true,
                schema: schemaUID,
                refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
                data: encodedData
            },
            wallet
        );

        // attestation.uid, .signature, .message -> serialize for db
        const signatureStr = JSON.stringify(attestation);

        await db.run(
            'INSERT INTO attestations (uid, recipient, event_name, reputation_value, signature_data) VALUES (?, ?, ?, ?, ?)',
            [attestation.uid, recipient.toLowerCase(), eventName, reputationValue, signatureStr]
        );

        // Automatically add it to their global reputation too so we track both!
        const user = await db.get('SELECT token_id FROM users WHERE address = ?', [recipient.toLowerCase()]);
        if (user && user.token_id) {
            console.log(`Auto-adding ${reputationValue} core reputation to Token ID ${user.token_id}...`);
            const tx = await identityContract.addReputation(user.token_id, reputationValue, "Attestation: " + eventName);
            await tx.wait();
        }

        res.json({ success: true, uid: attestation.uid, attestation });
    } catch (error) {
        console.error("EAS Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- EAS ATTESTATION ENDPOINTS ---

app.post("/api/attest/verify", async (req, res) => {
    try {
        // Manually verify the EIP-712 signature using ethers (chain-agnostic)
        const { attestation } = req.body;

        // Log to debug what the EAS SDK actually produces
        console.log("Attestation message keys:", Object.keys(attestation.message));
        console.log("Attestation domain:", attestation.domain);

        // Use the EXACT domain the SDK used when signing (pulled directly from payload)
        const domain = attestation.domain;

        // The attestation payload itself contains the exact types used during signing.
        // Use them directly instead of hardcoding to avoid any order/field mismatches.
        const types = attestation.types;

        // Build the value object in the exact field order from the types array,
        // casting BigInt fields correctly.
        const BIGINT_FIELDS = new Set(["time", "expirationTime", "nonce"]);
        const NUM_FIELDS = new Set(["version"]);
        const msg = attestation.message;
        const value = {};
        for (const { name } of types.Attest) {
            if (msg[name] === undefined) continue;
            if (BIGINT_FIELDS.has(name)) value[name] = BigInt(msg[name]);
            else if (NUM_FIELDS.has(name)) value[name] = Number(msg[name]);
            else value[name] = msg[name];
        }

        // Recover the signer from the raw compact signature
        const recovered = ethers.verifyTypedData(domain, types, value, attestation.signature);
        console.log("Recovered signer:", recovered);
        console.log("Expected issuer: ", wallet.address);

        if (recovered.toLowerCase() !== wallet.address.toLowerCase()) {
            return res.status(401).json({
                success: false,
                error: `Invalid signature. Expected ${wallet.address}, got ${recovered}`
            });
        }

        // Decode the payload data
        const decodedMap = schemaEncoder.decodeData(attestation.message.data);
        const data = {};
        decodedMap.forEach(item => {
            data[item.name] = item.value.value.toString();
        });

        res.json({
            success: true,
            message: "✅ Attestation verified as AUTHENTIC",
            issuer: wallet.address,
            recipient: attestation.message.recipient,
            details: data
        });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Issue Identity (Mocking the ZK proof result)
app.post("/api/identity/issue", async (req, res) => {
    try {
        const { address, isKycVerified, isOver18, initialReputation } = req.body;
        console.log(`Issuing identity for ${address}...`);

        const tx = await identityContract.issueIdentity(
            address,
            isKycVerified || false,
            isOver18 || false,
            initialReputation || 100
        );
        const receipt = await tx.wait();

        // Get TokenID from events
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'IdentityIssued');
        const tokenId = event ? event.args[1].toString() : "Unknown";

        // Store in DB
        await db.run(
            'INSERT OR REPLACE INTO users (address, token_id) VALUES (?, ?)',
            [address.toLowerCase(), tokenId]
        );

        res.json({ success: true, txHash: receipt.hash, tokenId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update Reputation
app.post("/api/identity/reputation", async (req, res) => {
    try {
        const { tokenId, amount, reason, type } = req.body; // type: 'add' or 'deduct'
        console.log(`${type} reputation for token ${tokenId}...`);

        let tx;
        if (type === 'add') {
            tx = await identityContract.addReputation(tokenId, amount, reason);
        } else {
            tx = await identityContract.deductReputation(tokenId, amount, reason);
        }
        const receipt = await tx.wait();

        // Log to DB
        await db.run(
            'INSERT INTO reputation_logs (token_id, amount, type, reason, tx_hash) VALUES (?, ?, ?, ?, ?)',
            [tokenId, amount, type, reason, receipt.hash]
        );

        res.json({ success: true, txHash: receipt.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Live Reputation (Decayed)
app.get("/api/identity/:tokenId", async (req, res) => {
    try {
        const { tokenId } = req.params;
        const score = await identityContract.getActiveReputation(tokenId);
        const data = await identityContract.identityData(tokenId);

        res.json({
            success: true,
            tokenId,
            activeReputation: score.toString(),
            baseReputation: data.baseReputationScore.toString(),
            isOver18: data.isOver18,
            isKycVerified: data.isKycVerified,
            lastUpdate: data.lastUpdateTimestamp.toString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- TICKET ENDPOINTS ---

// Mint programmatic ticket
app.post("/api/tickets/mint", async (req, res) => {
    try {
        const { to, requireAge18, minReputation, maxResalePrice } = req.body;
        console.log(`Minting ticket for ${to}...`);

        const tx = await ticketContract.issueTicket(
            to,
            requireAge18 || false,
            minReputation || 0,
            ethers.parseEther(maxResalePrice || "0.1")
        );
        const receipt = await tx.wait();

        // Store ticket in DB
        await db.run(
            'INSERT INTO tickets (owner_address, tx_hash) VALUES (?, ?)',
            [to.toLowerCase(), receipt.hash]
        );

        res.json({ success: true, txHash: receipt.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- USER PROFILE ENDPOINT ---

app.get("/api/user/:address", async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();

        // 1. Get Wallet Identity from DB
        const user = await db.get('SELECT * FROM users WHERE address = ?', [address]);

        let onChainData = null;
        let repLogs = [];

        if (user && user.token_id) {
            // 2. Fetch live on-chain data
            const score = await identityContract.getActiveReputation(user.token_id);
            const data = await identityContract.identityData(user.token_id);
            onChainData = {
                tokenId: user.token_id,
                activeReputation: score.toString(),
                baseReputation: data.baseReputationScore.toString(),
                isOver18: data.isOver18,
                isKycVerified: data.isKycVerified,
                lastUpdate: new Date(Number(data.lastUpdateTimestamp) * 1000).toLocaleString()
            };

            // 3. Get Rep Logs
            repLogs = await db.all('SELECT * FROM reputation_logs WHERE token_id = ? ORDER BY created_at DESC', [user.token_id]);
        }

        // 4. Get Tickets
        const tickets = await db.all('SELECT * FROM tickets WHERE owner_address = ? ORDER BY minted_at DESC', [address]);

        // 5. Get EAS Attestations
        const attestations = await db.all('SELECT uid, event_name, reputation_value, created_at, signature_data FROM attestations WHERE recipient = ? ORDER BY created_at DESC', [address]);

        res.json({
            success: true,
            wallet: address,
            identity: onChainData,
            tickets: tickets,
            reputationHistory: repLogs,
            verifiableAttestations: attestations.map(a => ({
                uid: a.uid,
                eventName: a.event_name,
                reputationValue: a.reputation_value,
                issuedAt: a.created_at,
                // Parse the full cryptographic signature payload to raw object
                payload: JSON.parse(a.signature_data)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`RacePass Backend Test API running on port ${PORT}`);
});
