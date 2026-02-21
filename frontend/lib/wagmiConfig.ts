import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadscan.com' },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(), // Browser extension wallets (includes MetaMask)
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
      metadata: {
        name: 'RacePass Identity',
        description: 'Universal identity and reputation for racing',
        url: 'https://racepass.xyz',
        icons: ['https://racepass.xyz/icon.png'],
      },
      showQrModal: true, // Show QR modal for mobile wallets
    }),
    coinbaseWallet({
      appName: 'RacePass Identity',
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true, // Enable server-side rendering support
});
