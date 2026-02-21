require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.28", // Use the correct version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    "polygon-amoy": {
      url: `https://polygon-amoy.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002
    },
    "monad-testnet": {
      url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
      accounts: process.env.MONAD_PRIVATE_KEY ? [process.env.MONAD_PRIVATE_KEY] : [],
      chainId: process.env.MONAD_CHAIN_ID ? parseInt(process.env.MONAD_CHAIN_ID) : 10143
    },
    [process.env.NETWORK]: {
      url: process.env.NETWORK === 'monad-testnet'
        ? (process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz")
        : process.env.NETWORK === 'polygon-amoy'
          ? `https://polygon-amoy.infura.io/v3/${process.env.INFURA_API_KEY}`
          : `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: process.env.NETWORK === 'monad-testnet'
        ? (process.env.MONAD_CHAIN_ID ? parseInt(process.env.MONAD_CHAIN_ID) : 10143)
        : process.env.NETWORK === 'polygon-amoy'
          ? 80002
          : 11155111
    },
  },
};
