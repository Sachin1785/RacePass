import { createConfig, http } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [polygonMumbai],
  connectors: [
    injected(), // MetaMask and other injected wallets
  ],
  transports: {
    [polygonMumbai.id]: http(),
  },
  ssr: true, // Enable server-side rendering support
});
