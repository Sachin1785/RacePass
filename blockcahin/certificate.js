// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

// Helper function to upload file to Pinata
async function uploadToPinata(filePath) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  // Add file metadata (optional)
  const metadata = JSON.stringify({
    name: path.basename(filePath),
  });
  data.append("pinataMetadata", metadata);

  try {
    const response = await axios.post(url, data, {
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_API_SECRET,
      },
    });
    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error uploading file to Pinata:", error.response?.data || error.message);
    throw error;
  }
}

// POST /issueCertificate endpoint
app.post("/issueCertificate", async (req, res) => {
  try {
    const { filePath, recipient } = req.body;
    if (!filePath || !recipient) {
      return res.status(400).json({ error: "Missing filePath or recipient" });
    }

    console.log(`Uploading file ${filePath} to Pinata...`);
    const ipfsHash = await uploadToPinata(filePath);
    console.log("File uploaded. IPFS hash:", ipfsHash);

    const provider = new ethers.InfuraProvider("sepolia", process.env.INFURA_API_KEY);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const certificateArtifact = require("./artifacts/contracts/Certificate.sol/Certificate.json");
    const certificateABI = certificateArtifact.abi;
    const certificateAddress = process.env.CERTIFICATE_ADDRESS;

    const certificateContract = new ethers.Contract(certificateAddress, certificateABI, signer);

    console.log(`Issuing certificate to ${recipient} with hash ${ipfsHash}...`);
    
    // Send the transaction
    const tx = await certificateContract.issueCertificate(recipient, ipfsHash);
    console.log("Transaction sent:", tx.hash);
    
    // Wait for transaction with event parsing
    const receipt = await tx.wait();
    console.log("Transaction mined:", receipt.hash);
    
    // In ethers v6, we need to parse logs manually if events are undefined
    let certificateId = null;
    
    if (receipt.logs) {
      // Parse logs using the contract interface
      const iface = certificateContract.interface;
      
      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog && parsedLog.name === "CertificateIssued") {
            certificateId = parsedLog.args.certId.toString();
            console.log("Found CertificateIssued event, ID:", certificateId);
            break;
          }
        } catch (e) {
          // Skip logs that don't match our event signature
          continue;
        }
      }
    }
    
    // If we still don't have a certificate ID, we can query the contract
    if (!certificateId) {
      console.log("Could not find CertificateIssued event, querying certificate count...");
      const currentCount = await certificateContract.certCount();
      certificateId = currentCount.toString();
      console.log("Using current certificate count:", certificateId);
    }

    res.json({
      message: "Certificate issued successfully",
      transactionHash: receipt.hash,
      certificateId,
      ipfsHash,
      viewUrl: "https://gateway.pinata.cloud/ipfs/" + ipfsHash,
    });
  } catch (error) {
    console.error("Error issuing certificate:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/viewCertificate/:certId", async (req, res) => {
  try {
    const certId = req.params.certId;
    const provider = new ethers.InfuraProvider("sepolia", process.env.INFURA_API_KEY);
    const certificateArtifact = require("./artifacts/contracts/Certificate.sol/Certificate.json");
    const certificateABI = certificateArtifact.abi;
    const certificateAddress = process.env.CERTIFICATE_ADDRESS;
    const certificateContract = new ethers.Contract(certificateAddress, certificateABI, provider);

    // Retrieve the certificate record from the public mapping
    const cert = await certificateContract.certificates(certId);
    res.json({
      certificateId: certId,
      issuer: cert.issuer,
      recipient: cert.recipient,
      ipfsHash: cert.ipfsHash,
      issuedAt: cert.issuedAt.toString(),
      viewUrl: "https://gateway.pinata.cloud/ipfs/" + cert.ipfsHash,
    });
  } catch (error) {
    console.error("Error viewing certificate:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Certificate API server is running on port ${PORT}`);
});
