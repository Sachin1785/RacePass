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
        filename: "./racepass_v4.db",
        driver: sqlite3.Database
    });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            address TEXT PRIMARY KEY,
            token_id TEXT,
            issued_at DATETIMEDEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS events (
            event_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT,
            price TEXT,
            image_emoji TEXT,
            image_url TEXT,
            requires_kyc BOOLEAN DEFAULT 1,
            min_age INTEGER DEFAULT 18,
            min_reputation INTEGER DEFAULT 0,
            tickets_minted INTEGER DEFAULT 0,
            tickets_checked_in INTEGER DEFAULT 0,
            max_tickets INTEGER DEFAULT 1000,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tickets (
            ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
            on_chain_id TEXT,
            owner_address TEXT,
            event_id INTEGER,
            tx_hash TEXT,
            minted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(event_id)
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

    // Migration: Add event_id column to tickets table if it doesn't exist
    try {
        const tableInfo = await db.all("PRAGMA table_info(tickets)");
        const hasEventId = tableInfo.some(col => col.name === 'event_id');
        if (!hasEventId) {
            console.log("Migrating tickets table: adding event_id column...");
            await db.run('ALTER TABLE tickets ADD COLUMN event_id INTEGER REFERENCES events(event_id)');
            console.log("Migration completed.");
        }
    } catch (error) {
        console.error("Migration error:", error);
    }
    // Migration: Add image_url column to events table if it doesn't exist
    try {
        const eventsInfo = await db.all("PRAGMA table_info(events)");
        const hasImageUrl = eventsInfo.some(col => col.name === 'image_url');
        if (!hasImageUrl) {
            console.log("Migrating events table: adding image_url column...");
            await db.run('ALTER TABLE events ADD COLUMN image_url TEXT');
            console.log("image_url migration completed.");
        }
    } catch (error) {
        console.error("image_url migration error:", error);
    }

    // Seed sample events if table is empty
    const eventCount = await db.get('SELECT COUNT(*) as count FROM events');
    if (eventCount.count === 0) {
        console.log("Seeding sample events...");
        await db.run(`
            INSERT INTO events (name, date, location, description, price, image_emoji, requires_kyc, min_age, min_reputation) VALUES
            ('Formula E Championship 2026', '2026-03-15', 'Mumbai, India', 'Experience the future of racing with electric vehicles', '₹5,000', '🏎️', 1, 18, 50),
            ('Tech Conference 2026', '2026-04-22', 'Bangalore, India', 'Join industry leaders in blockchain and AI innovation', '₹2,500', '💻', 1, 16, 0),
            ('Music Festival Summer', '2026-06-10', 'Goa, India', 'A weekend of electronic music and beach vibes', '₹8,000', '🎵', 1, 21, 0),
            ('Crypto Summit 2026', '2026-05-05', 'Dubai, UAE', 'Explore the future of decentralized finance', '$500', '₿', 1, 18, 100)
        `);
        console.log("Sample events seeded successfully.");
    }
})();

// Contract Artifacts (built by Hardhat)
const IdentityArtifact = require("./artifacts/contracts/RacePassIdentity.sol/RacePassIdentity.json");
const TicketArtifact = require("./artifacts/contracts/RacePassTicket.sol/RacePassTicket.json");

const app = express();

// Fix for "Private Network Access" CORS issues (Public site -> Localhost API)
app.use((req, res, next) => {
    // If browser asks for private network access, allow it
    if (req.headers['access-control-request-private-network']) {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }

    // Allow all origins, methods, and headers for the hackathon
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization, ngrok-skip-browser-warning');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CONFIG
const RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY;
const IDENTITY_ADDRESS = "0x97d59a00FdfBea72C9D95d2C43AdAa1938608d5f";
const TICKET_ADDRESS = "0xb3BA57B6FEDb83030244e1fe6DB832dfC77B1c57";

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

// Helper to issue EAS attestation
async function issueAttestationHelper(recipient, eventName, reputationValue) {
    console.log(`Issuing EAS Offchain Attestation to ${recipient} for ${eventName}`);

    const encodedData = schemaEncoder.encodeData([
        { name: "eventName", value: eventName, type: "string" },
        { name: "reputationValue", value: reputationValue, type: "uint256" }
    ]);

    const attestation = await offchain.signOffchainAttestation(
        {
            recipient: recipient,
            expirationTime: 0n,
            time: BigInt(Math.floor(Date.now() / 1000)),
            revocable: true,
            schema: schemaUID,
            refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
            data: encodedData
        },
        wallet
    );

    const signatureStr = JSON.stringify(attestation);

    await db.run(
        'INSERT INTO attestations (uid, recipient, event_name, reputation_value, signature_data) VALUES (?, ?, ?, ?, ?)',
        [attestation.uid, recipient.toLowerCase(), eventName, reputationValue, signatureStr]
    );

    const user = await db.get('SELECT token_id FROM users WHERE address = ?', [recipient.toLowerCase()]);
    if (user && user.token_id) {
        console.log(`Auto-adding ${reputationValue} core reputation to Token ID ${user.token_id}...`);
        try {
            const tx = await identityContract.addReputation(user.token_id, reputationValue, "Attestation: " + eventName);
            const receipt = await tx.wait();

            // Log the automated reputation change to the history table
            await db.run(
                'INSERT INTO reputation_logs (token_id, amount, type, reason, tx_hash) VALUES (?, ?, ?, ?, ?)',
                [user.token_id, reputationValue, 'add', "Auto-Reward: " + eventName, receipt.hash]
            );
            console.log(`Reputation history logged for Token ID ${user.token_id}`);
        } catch (e) {
            console.warn("Reputation update skipped (likely insufficient balance or network issue):", e.message);
        }
    }
    return attestation;
}

app.post("/api/attest/issue", async (req, res) => {
    try {
        const { recipient, eventName, reputationValue } = req.body;
        const attestation = await issueAttestationHelper(recipient, eventName, reputationValue);
        res.json({ success: true, uid: attestation.uid, attestation });
    } catch (error) {
        console.error("EAS Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- KYC CHECK ENDPOINT ---
app.get("/api/kyc/status/:address", async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();

        // Check if user exists in our local DB first
        const user = await db.get('SELECT * FROM users WHERE address = ?', [address]);

        if (!user || !user.token_id) {
            return res.json({
                success: true,
                isVerified: false,
                message: "No RacePass identity found for this wallet."
            });
        }

        // verify on-chain status
        try {
            const data = await identityContract.identityData(user.token_id);
            res.json({
                success: true,
                isVerified: data.isKycVerified,
                tokenId: user.token_id,
                onChainData: {
                    isKycVerified: data.isKycVerified,
                    isOver18: data.isOver18,
                    isRevoked: data.isRevoked
                }
            });
        } catch (e) {
            // If token exists in DB but not on chain (rare), treat as not verified
            res.json({ success: true, isVerified: false, error: "Token found in DB but could not fetch from chain" });
        }
    } catch (error) {
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

        // Check if user already exists to prevent duplicate minting
        const existingUser = await db.get('SELECT * FROM users WHERE address = ?', [address.toLowerCase()]);
        if (existingUser && existingUser.token_id && existingUser.token_id !== "Unknown") {
            return res.json({
                success: true,
                message: "Identity already exists",
                tokenId: existingUser.token_id,
                alreadyIssued: true
            });
        }

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
        const { to, eventId, eventName, requireAge18, minReputation, maxResalePrice } = req.body;
        console.log(`Minting ticket for ${eventName} (Event ID: ${eventId}) to ${to}...`);

        // Get event details if eventId is provided
        let dbEventId = eventId;
        if (eventId) {
            const event = await db.get('SELECT * FROM events WHERE event_id = ?', [eventId]);
            if (!event) {
                return res.status(404).json({ success: false, error: "Event not found" });
            }

            // Check if event is sold out
            if (event.tickets_minted >= event.max_tickets) {
                return res.status(400).json({ success: false, error: "Event is sold out" });
            }
        }

        const tx = await ticketContract.issueTicket(
            to,
            eventName || "General Access",
            requireAge18 || false,
            minReputation || 0,
            ethers.parseEther(maxResalePrice || "0.1")
        );
        const receipt = await tx.wait();

        // Extract Token ID from events
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'TicketIssued');
        const onChainId = event ? event.args[1].toString() : "Unknown";

        // Store ticket in DB with event_id
        await db.run(
            'INSERT INTO tickets (on_chain_id, owner_address, event_id, tx_hash) VALUES (?, ?, ?, ?)',
            [onChainId, to.toLowerCase(), dbEventId, receipt.hash]
        );

        // Increment event's tickets_minted counter
        if (dbEventId) {
            await updateEventStats(dbEventId, 'tickets_minted');
        }

        res.json({ success: true, txHash: receipt.hash, onChainId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Revoke Identity
app.post("/api/identity/revoke", async (req, res) => {
    try {
        const { tokenId, status } = req.body; // status: true to revoke, false to restore
        console.log(`Setting revocation status to ${status} for token ${tokenId}...`);

        const tx = await identityContract.revokeIdentity(tokenId, status);
        const receipt = await tx.wait();

        res.json({ success: true, txHash: receipt.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ticket Check-in (Manual by Token ID)
app.post("/api/tickets/check-in", async (req, res) => {
    try {
        const { tokenId, eventName, reputationValue } = req.body;
        const rep = parseInt(reputationValue) || 50;
        console.log(`Checking in ticket ${tokenId} for event ${eventName}...`);

        const tx = await ticketContract.checkIn(tokenId, eventName);
        const receipt = await tx.wait();

        // New: Auto-issue EAS attestation on check-in
        const owner = await ticketContract.ownerOf(tokenId);
        const attestation = await issueAttestationHelper(owner, eventName, rep);

        // Update event check-in counter
        const ticket = await db.get('SELECT event_id FROM tickets WHERE on_chain_id = ?', [tokenId]);
        if (ticket && ticket.event_id) {
            await updateEventStats(ticket.event_id, 'tickets_checked_in');
        }

        res.json({
            success: true,
            txHash: receipt.hash,
            attestationUid: attestation.uid,
            message: `Check-in successful! Attestation issued to ${owner}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Magic Check-in (Automatic by Wallet Address)
// Finds the first valid ticket for the event owned by this address
app.post("/api/tickets/check-in-by-address", async (req, res) => {
    try {
        const { address, eventName } = req.body;
        const normalizedAddress = address.toLowerCase();
        console.log(`Scanning for ${eventName} tickets owned by ${normalizedAddress}...`);

        // 1. Get all tickets for this address from our DB
        const userTickets = await db.all('SELECT on_chain_id FROM tickets WHERE owner_address = ?', [normalizedAddress]);

        if (!userTickets || userTickets.length === 0) {
            return res.status(404).json({ success: false, error: "No tickets found for this address in our records." });
        }

        // 2. iterate through them to find one that is NOT checked in and matches the event
        let targetTokenId = null;

        for (const t of userTickets) {
            if (t.on_chain_id === "Unknown") continue;

            try {
                const isUsed = await ticketContract.checkedIn(t.on_chain_id);
                if (!isUsed) {
                    const details = await ticketContract.ticketDetails(t.on_chain_id);
                    if (details.eventName === eventName) {
                        targetTokenId = t.on_chain_id;
                        break; // Found it!
                    }
                }
            } catch (e) {
                console.warn(`Skipping ticket ${t.on_chain_id} due to error:`, e.message);
            }
        }

        if (!targetTokenId) {
            return res.status(400).json({ success: false, error: `No valid, unused tickets found for "${eventName}" at this address.` });
        }

        // 3. Perform the check-in
        const { reputationValue } = req.body;
        const rep = parseInt(reputationValue) || 50;

        console.log(`Auto-checking in Ticket ID: ${targetTokenId}`);
        const tx = await ticketContract.checkIn(targetTokenId, eventName);
        const receipt = await tx.wait();

        // New: Auto-issue EAS attestation on check-in
        const attestation = await issueAttestationHelper(normalizedAddress, eventName, rep);

        // Update event check-in counter
        const ticket = await db.get('SELECT event_id FROM tickets WHERE on_chain_id = ?', [targetTokenId]);
        if (ticket && ticket.event_id) {
            await updateEventStats(ticket.event_id, 'tickets_checked_in');
        }

        res.json({
            success: true,
            message: `Success! Checked in ticket #${targetTokenId} and issued reputation credential.`,
            tokenId: targetTokenId,
            attestationUid: attestation.uid,
            txHash: receipt.hash
        });

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
                isRevoked: data.isRevoked,
                lastUpdate: new Date(Number(data.lastUpdateTimestamp) * 1000).toLocaleString()
            };

            // 3. Get Rep Logs
            repLogs = await db.all('SELECT * FROM reputation_logs WHERE token_id = ? ORDER BY created_at DESC', [user.token_id]);
        }

        // 4. Get Tickets
        const rawTickets = await db.all('SELECT * FROM tickets WHERE owner_address = ? ORDER BY minted_at DESC', [address]);
        const tickets = await Promise.all(rawTickets.map(async (t) => {
            let isCheckedIn = false;
            let eventName = "Unknown Event";
            if (t.on_chain_id && t.on_chain_id !== "Unknown") {
                try {
                    isCheckedIn = await ticketContract.checkedIn(t.on_chain_id);
                    const details = await ticketContract.ticketDetails(t.on_chain_id);
                    eventName = details.eventName;
                } catch (e) {
                    console.error("Error fetching ticket details:", e);
                }
            }
            return {
                dbId: t.ticket_id,
                onChainId: t.on_chain_id,
                txHash: t.tx_hash,
                mintedAt: t.minted_at,
                isCheckedIn: isCheckedIn,
                eventName: eventName
            };
        }));

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

// --- EVENT MANAGEMENT ENDPOINTS ---

// Get all events
app.get("/api/events", async (req, res) => {
    try {
        const events = await db.all(`
            SELECT 
                event_id as id,
                name,
                date,
                location,
                description,
                price,
                image_emoji as image,
                image_url as imageUrl,
                requires_kyc as requiresKyc,
                min_age as minAge,
                min_reputation as minReputation,
                tickets_minted as ticketsMinted,
                tickets_checked_in as ticketsCheckedIn,
                max_tickets as maxTickets,
                is_active as isActive
            FROM events 
            WHERE is_active = 1
            ORDER BY date ASC
        `);
        res.json({ success: true, events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single event with detailed stats
app.get("/api/events/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await db.get(`
            SELECT 
                event_id as id,
                name,
                date,
                location,
                description,
                price,
                image_emoji as image,
                image_url as imageUrl,
                requires_kyc as requiresKyc,
                min_age as minAge,
                min_reputation as minReputation,
                tickets_minted as ticketsMinted,
                tickets_checked_in as ticketsCheckedIn,
                max_tickets as maxTickets,
                is_active as isActive,
                created_at as createdAt
            FROM events 
            WHERE event_id = ?
        `, [eventId]);

        if (!event) {
            return res.status(404).json({ success: false, error: "Event not found" });
        }

        // Get attendee list (addresses that checked in)
        const attendees = await db.all(`
            SELECT DISTINCT t.owner_address, t.minted_at
            FROM tickets t
            WHERE t.event_id = ?
            ORDER BY t.minted_at DESC
        `, [eventId]);

        res.json({
            success: true,
            event,
            attendees,
            stats: {
                totalMinted: event.ticketsMinted,
                totalCheckedIn: event.ticketsCheckedIn,
                attendanceRate: event.ticketsMinted > 0 ? ((event.ticketsCheckedIn / event.ticketsMinted) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new event (Admin endpoint)
// Accepts imageUrl as a base64 data URL for the event cover image
app.post("/api/events", async (req, res) => {
    try {
        const {
            name,
            date,
            location,
            description,
            price,
            imageEmoji = '🎫',
            imageUrl = null,
            requiresKyc = true,
            minAge = 18,
            minReputation = 0,
            maxTickets = 1000
        } = req.body;

        if (!name || !date || !location) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: name, date, location"
            });
        }

        const result = await db.run(`
            INSERT INTO events (name, date, location, description, price, image_emoji, image_url, requires_kyc, min_age, min_reputation, max_tickets)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, date, location, description, price, imageEmoji, imageUrl, requiresKyc ? 1 : 0, minAge, minReputation, maxTickets]);

        res.json({
            success: true,
            eventId: result.lastID,
            message: "Event created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update event (Admin endpoint)
app.put("/api/events/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;
        const {
            name,
            date,
            location,
            description,
            price,
            imageEmoji,
            imageUrl,          // base64 data URL or null to clear
            requiresKyc,
            minAge,
            minReputation,
            maxTickets,
            isActive
        } = req.body;

        // Confirm event exists
        const existing = await db.get('SELECT event_id FROM events WHERE event_id = ?', [eventId]);
        if (!existing) {
            return res.status(404).json({ success: false, error: "Event not found" });
        }

        await db.run(`
            UPDATE events SET
                name            = COALESCE(?, name),
                date            = COALESCE(?, date),
                location        = COALESCE(?, location),
                description     = COALESCE(?, description),
                price           = COALESCE(?, price),
                image_emoji     = COALESCE(?, image_emoji),
                image_url       = ?,
                requires_kyc    = COALESCE(?, requires_kyc),
                min_age         = COALESCE(?, min_age),
                min_reputation  = COALESCE(?, min_reputation),
                max_tickets     = COALESCE(?, max_tickets),
                is_active       = COALESCE(?, is_active)
            WHERE event_id = ?
        `, [
            name, date, location, description, price, imageEmoji,
            imageUrl !== undefined ? imageUrl : null,   // explicit null clears image
            requiresKyc !== undefined ? (requiresKyc ? 1 : 0) : null,
            minAge, minReputation, maxTickets,
            isActive !== undefined ? (isActive ? 1 : 0) : null,
            eventId
        ]);

        res.json({ success: true, message: "Event updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update event stats (called internally when tickets are minted/checked in)
async function updateEventStats(eventId, field) {
    try {
        await db.run(`UPDATE events SET ${field} = ${field} + 1 WHERE event_id = ?`, [eventId]);
    } catch (error) {
        console.error(`Failed to update event stats for field ${field}:`, error);
    }
}

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`RacePass Backend Test API running on port ${PORT}`);
});
