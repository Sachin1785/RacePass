# RacePass - Universal Identity & Reputation Layer

A blockchain-based KYC verification and universal identity system built with Next.js, TypeScript, and Web3 technologies. Users complete identity verification once with Didit, receive reusable verifiable credentials, and can prove eligibility across platforms without re-verification.

## 🚀 Features

- **One-Time KYC**: Complete identity verification once with Didit SDK
- **Privacy-Preserving**: Secure verification through Didit's platform
- **Wallet Integration**: Connect via MetaMask
- **Real KYC Provider**: Integrated with Didit verification service
- **Cross-Platform**: Portable identity that works across different platforms
- **Event Access**: Access age-restricted events using verified identity

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: wagmi 3.5, viem 2.46
- **KYC Provider**: Didit (@didit-protocol/sdk-web)
- **Authentication**: next-auth, SIWE (Sign-In with Ethereum)
- **Network**: Polygon Mumbai Testnet (for development)

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension installed

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the following in `.env.local`:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `DIDIT_API_KEY`: Your Didit API key from [Didit Console](https://business.didit.me)
   - `DIDIT_WORKFLOW_ID`: Your workflow ID from Didit Console → Workflows
   - `DIDIT_API_ENDPOINT`: `https://verification.didit.me` (default)

   **Getting Didit Credentials:**
   1. Sign up at https://business.didit.me
   2. Create a new workflow in the dashboard
   3. Copy your API key from API & Webhooks section
   4. Copy your workflow ID from the Workflows page

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to http://localhost:3000

## 🎯 Usage Flow
Click "Start Identity Verification" button
- Didit verification modal will open
- Follow the guided process:
  - Select document type and country
  - Capture front/back of ID document
  - Take a selfie for liveness check
  - Verify email/phone (if required by workflow)
- Submit for verification
- Upon completion, you'll be redirected to the success page
- Fill in your personal information:
  - Full name
  - Residential address
  - Date of birth (must be 18+)
  - Upload government-issued ID
  - Upload a live selfie
- Submit for verification
- Wait for approval (mock verification takes ~2 seconds)
Verification Status
- Upon successful verification, your session is stored
- View your verification status in the Dashboard
- Status can be: Approved, Pending, In Review, or Decliner browser's localStorage
- View your credential in the Dashboard

### 4. Access Events
- Browse upcoming events requiring KYC verification
- Use your verifiable credential to prove eligibility
- No need to repeat identity checks

## 📁 Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── kyc/route.ts          # KYC verification API endpoint
│   ├── dashboard/page.tsx        # User dashboard with credentials
│   ├── events/page.tsx           # Event listing page
│   ├── kyc/
│   │   ├── page.tsx              # KYC submission form
│   │   └── success/page.tsx      # Verification success page
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   └── providers.tsx             # Wagmi and React Query providers
├── components/
│   ├── ConnectWallet.tsx         # Wallet connection button
│   ├── CredentialCard.tsx        # Display verifiable credentials
│   ├── ImageUpload.tsx           # Image upload with preview
│   ├── KycForm.tsx               # KYC data collection form
│   └── Navbar.tsx                # Navigation bar
├── lib/
│   └── wagmiConfig.ts            # Wagmi blockchain configuration
├── types/
│   └── kyc.ts                    # TypeScript type definitions
└── .env.local                    # Environment variables (create this)
```

## 🔐 Security & Privacy

- **No PII on Blockchain**: Personal data is never stored on-chain
- **Direct Provider Communication**: KYC data sent directly to verification partner
- **Encrypted Storage**: Credentials stored with encryption
- **User Control**: Only you control who accesses your verification status
- **Cryptographic Signatures**: Credentials are tamper-proof and verifiable

## 🧪 Development Mode

The application currently uses a **mock KYC verification API** for development. This simulates the Didit verification process without making real API calls.

To integrate with real Didit API:
1. Obtain Didit API credentials
2. Update `DIDIT_API_KEY` and `DIDIT_API_ENDPOINT` in `.env.local`
3. Uncomment the production API code in `app/api/kyc/route.ts`

## 🚧 Phase 1 Complete - Next Steps

✅ **Completed:**
- MetaMask wallet integration with wagmi
- KYC form and submission flow
- Mock API verification
- Verifiable credential display
- Dashboard and events pages

🔜 **Phase 2 (Smart Contracts):**
- Deploy KycRegistry contract to Polygon Mumbai
- Deploy EventPass (ERC-721) contract
- Integrate on-chain KYC attestation
- Implement ticket minting with eligibility checks

🔜 **Phase 3 (ZKP & Advanced Features):**
- Zero-knowledge proof integration (Polygon ID)
- Selective disclosure UI
- Age verification without revealing DOB
- Reputation system

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_SECRET` | Secret for NextAuth sessions | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `DIDIT_API_KEY` | Didit KYC provider API key | No (mock mode) |
| `DIDIT_API_ENDPOINT` | Didit API endpoint | No (mock mode) |
| `NEXT_PUBLIC_CHAIN_ID` | Blockchain network ID (80001 for Mumbai) | Yes |
| `NEXT_PUBLIC_PROVIDER_URL` | RPC endpoint URL | Yes |
| `NEXT_PUBLIC_KYC_REGISTRY_ADDRESS` | On-chain registry contract | Phase 2 |
| `NEXT_PUBLIC_EVENT_PASS_ADDRESS` | Event pass contract | Phase 2 |

## 🐛 Troubleshooting

**Issue**: Wallet not connecting
- Ensure you have MetaMask browser extension installed
- Check that you're on the correct network (Polygon Mumbai)
- Try refreshing the page and reconnecting

**Issue**: KYC submission fails
- Check browser console for error messages
- Ensure all form fields are filled
- Verify images are under 10MB

**Issue**: Credential not appearing
- Check browser's localStorage for `kyc_credential`
- Clear cache and retry verification
- Ensure you completed the full KYC flow

---

Built with ❤️ for the blockchain hackathon
