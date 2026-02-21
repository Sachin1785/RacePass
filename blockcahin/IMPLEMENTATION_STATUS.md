# 🏎️ RacePass: Identity & Reputation Implementation Status

This document tracks the current progress of the RacePass blockchain-based identity, reputation, and programmable ticketing system deployed on the **Monad Testnet**.

## ✅ 1. Completed Features

### 🆔 Portable Digital Identity (Identity SBT)
- **On-Chain Soulbound Token (SBT)**: Implemented in `RacePassIdentity.sol`. A non-transferable token representing a user's verified identity.
- **Privacy-Preserving Attributes**: Stores binary flags (e.g., `isOver18`, `isKycVerified`) instead of raw PII.
- **Identity Revocation**: Implemented an administrative `isRevoked` flag that instantly invalidates user access across all platform services.
- **Backend Issuance API**: `/api/identity/issue` endpoint to trigger on-chain minting after off-chain verification.

### 🛡️ Privacy-Preserving Eligibility (EAS Integration)
- **Off-Chain Attestations**: Leveraged the **Ethereum Attestation Service (EAS)** for signing EIP-712 structured credentials.
- **Cryptographic Verifier**: Built a chain-agnostic backend verifier (`/api/attest/verify`) that validates EAS signatures against the trusted issuer wallet without needing on-chain calls.
- **Selective Disclosure**: Users can present specific JSON proofs (like "Over 18" or "Event Attendee") without revealing their entire wallet history.

### 🌟 Dynamic Reputation System
- **"Tire Wear" Time Decay**: Implemented on-chain logic to calculate reputation that naturally decays over time if not refreshed by attending events.
- **Per-Event Rewards**: Automatic reputation point issuance upon successful event check-in.
- **Reputation Logs**: SQLite tracking of all on-chain reputation changes with reason codes and transaction hashes.

### 🎟️ Programmable Event Access Passes (Smart Tickets)
- **NFT Access Passes**: Implemented in `RacePassTicket.sol` (ERC-721).
- **Identity-Bound Transfers**: Continuous enforcement during transfers—a ticket can only be sent to or held by a wallet with a valid `RacePassIdentity`.
- **Event-Specific Check-in**: On-chain verification that a ticket matches the specific Gate's event name at scan-time.
- **"Magic Scan" Entry Flow**: `/api/tickets/check-in-by-address` endpoint that auto-finds and scans the correct ticket for a user by just their wallet address.
- **Bundled Reward Lifecycle**: Atomic check-in process that simultaneously:
    1. Marks Ticket as Used on Monad.
    2. Issues a portable EAS Credential. 
    3. Adds Core Reputation points on-chain.

---

## ⏳ 2. Remaining Features (In Progress)

### 🚨 Anti-Scalping Enforcement
- **Status**: ~70% Done.
- **Remaining**: The `maxResalePrice` is stored on-chain, but we need an embedded `buy()` function in the contract to facilitate the swap and strictly enforce that specific price ceiling during secondary sales.

### 🌉 Cross-Chain & Platform Portability
- **Status**: ~40% Done.
- **Remaining**: **Cross-Chain Resolver**. An off-chain service or oracle that allows a contract on Polygon or Ethereum to verify a user's Monad-based Identity/Reputation.

### 📦 Presentation Flow
- **Status**: ~20% Done.
- **Remaining**: A standardized API to bundle multiple selective EAS attestations into a single "Presentation" blob for high-impact partner verifications (e.g., "Show me 3 race proofs to unlock VIP lounge").

---

## 🛠️ Technical Stack
- **Blockchain**: Monad Testnet
- **Smart Contracts**: Solidity (Hardhat)
- **Identity Standards**: ERC-721 (SBT variant), EAS (Ethereum Attestation Service), EIP-712
- **Backend**: Node.js, Express, Ethers.js v6, SQLite3
- **Frontend**: Vanilla JS (Test UI)

---
*Last Updated: February 21, 2026*
