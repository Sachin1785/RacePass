require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

// Load contract ABIs
const paymentArtifact = require("./artifacts/contracts/Payment.sol/Payment.json");
const tokenEscrowArtifact = require("./artifacts/contracts/TokenEscrow.sol/TokenEscrow.json");
const PaymentABI = paymentArtifact.abi;
const TokenEscrowABI = tokenEscrowArtifact.abi;

// ERC20 ABI with all required functions
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

// Contract addresses for TokenEscrow
const ESCROW_ADDRESSES = {
  'polygon-amoy': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  'monad': '0x90dB6077A4efD2eB3CF46d706C82be1bB9F6D67b'
};

// Token addresses on different chains
const TOKEN_ADDRESSES = {
  'polygon-amoy': {
    'USDC': '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23'  // Replace with actual USDC address on Polygon Amoy
  },
  'monad': {
    'MON': '0x201e45cec5b24c8c56b74286035bfe943685cd77',  // MON ERC20 token on Monad (lowercase)
    'USDC': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'  // USDC on Monad (lowercase)
  }
};

// Network configurations
const NETWORKS = {
  'polygon-amoy': {
    rpcUrl: 'https://rpc-amoy.polygon.technology',  // Official Polygon Amoy RPC
    privateKey: process.env.PRIVATE_KEY,
    chainId: 80002  // Polygon Amoy chain ID
  },
  'monad': {
    rpcUrl: process.env.MONAD_RPC_URL,
    privateKey: process.env.MONAD_PRIVATE_KEY,
    chainId: parseInt(process.env.MONAD_CHAIN_ID || "10143")
  }
};

const app = express();
app.use(express.json());

// Set up a provider and signer for Monad testnet
const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL, {
  chainId: Number(process.env.MONAD_CHAIN_ID),
  name: "monad-testnet"
});
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Use your deployed contract address from the .env file
const paymentContractAddress = process.env.PAYMENT_ADDRESS;
if (!paymentContractAddress) {
  console.error("Please set PAYMENT_ADDRESS in your .env file");
  process.exit(1);
}

// Create an instance of your Payment contract with the signer
const paymentContract = new ethers.Contract(paymentContractAddress, PaymentABI, signer);



/**
 * POST /sendPayment
 * JSON body should include:
 *   - sender: (informational) sender address
 *   - receiver: recipient Ethereum address
 *   - amount: amount to send
 *   - token: "MON" (default: "MON")
 */
app.post("/sendPayment", async (req, res) => {
  try {
  const { sender, receiver, amount, token = "MON" } = req.body;
    if (!receiver || !amount) {
      return res.status(400).json({ error: "Missing required parameters: receiver, amount" });
    }

    // Validate Ethereum address
    if (!ethers.isAddress(receiver)) {
      return res.status(400).json({ error: "Invalid receiver address" });
    }

    console.log(`Received request: sender ${sender}, receiver ${receiver}, amount ${amount} ${token}`);

    // Check sender balance before attempting transaction
    const senderAddress = signer.address;
    let hasEnoughBalance = false;
    let currentBalance = "0";

    // Only MON supported on Monad testnet
    // Check MON balance
    const monBalance = await provider.getBalance(senderAddress);
    const monFormatted = ethers.formatEther(monBalance);
    currentBalance = monFormatted;
    // Reserve some MON for gas fees (0.01 MON)
    const gasReserve = 0.01;
    hasEnoughBalance = parseFloat(monFormatted) >= (parseFloat(amount) + gasReserve);
    if (!hasEnoughBalance) {
      return res.status(400).json({ 
        error: "Insufficient MON balance (including gas reserve)",
        currentBalance: currentBalance,
        requiredAmount: amount,
        gasReserve: gasReserve,
        token: "MON"
      });
    }
    // Send MON through the Payment contract
    tx = await paymentContract.sendPayment(receiver, {
      value: ethers.parseEther(amount.toString()),
    });
    console.log(`Sending ${amount} MON to ${receiver}`);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    res.json({ 
  message: `MON payment sent successfully`, 
  txHash: receipt.transactionHash,
  token: "MON",
  amount: amount,
  receiver: receiver,
  gasUsed: receipt.gasUsed.toString(),
  blockNumber: receipt.blockNumber
    });
  } catch (error) {
    console.error("Error in /sendPayment:", error);
    res.status(500).json({ 
      error: error.shortMessage || error.message,
      details: error.reason || "Transaction failed"
    });
  }
});

/**
 * GET /my-balance
 * Get your own wallet's MON balance
 */
app.get("/my-balance", async (req, res) => {
  try {
    const address = signer.address;
    
    // Get MON balance
    const monBalance = await provider.getBalance(address);
    const monFormatted = ethers.formatEther(monBalance);
    res.json({
      address: address,
      balances: {
        MON: monFormatted
      }
    });
  } catch (error) {
    console.error("Error in /my-balance:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /balance/:address
 * Get MON balance for a given address
 */
app.get("/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    // Get MON balance
    const monBalance = await provider.getBalance(address);
    const monFormatted = ethers.formatEther(monBalance);
    res.json({
      address: address,
      balances: {
        MON: monFormatted
      }
    });
  } catch (error) {
    console.error("Error in /balance:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /network-info
 * Get current network information
 */
app.get("/network-info", async (req, res) => {
  try {
    const network = await provider.getNetwork();
    res.json({
      name: network.name,
      chainId: network.chainId.toString(),
      paymentContract: paymentContractAddress,
      escrowContracts: ESCROW_ADDRESSES
    });
  } catch (error) {
    console.error("Error in /network-info:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /lock
 * Lock tokens in escrow
 * Body:
 *   - sellerAddress: address of the seller
 *   - amount: amount of tokens to lock
 *   - tokenAddress: address of the ERC20 token
 *   - chain: 'polygon-amoy' or 'monad'
 */
app.post("/lock", async (req, res) => {
  try {
    const { sellerAddress, amount, tokenSymbol, chain } = req.body;

    // Validate input
    if (!sellerAddress || !amount || !tokenSymbol || !chain) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Validate token symbol
    if (!['MON', 'USDC'].includes(tokenSymbol)) {
      return res.status(400).json({ error: "Invalid token symbol. Supported tokens: MON, USDC" });
    }

    // Convert floating-point amount to token units
    let amountInTokenUnits;
    try {
      const floatAmount = parseFloat(amount);
      if (isNaN(floatAmount) || floatAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      // USDC has 6 decimals, MON has 18
      const decimals = tokenSymbol === 'USDC' ? 6 : 18;
      amountInTokenUnits = ethers.parseUnits(floatAmount.toString(), decimals);
      console.log(`Converting ${floatAmount} ${tokenSymbol} to ${amountInTokenUnits} base units (${decimals} decimals)`);
    } catch (error) {
      return res.status(400).json({ error: "Invalid amount format" });
    }

    // Get token address for the specified chain
    const tokenAddress = TOKEN_ADDRESSES[chain]?.[tokenSymbol];
    if (!tokenAddress) {
      return res.status(400).json({ error: `${tokenSymbol} not supported on ${chain}` });
    }

    // Validate chain
    if (!ESCROW_ADDRESSES[chain]) {
      return res.status(400).json({ error: "Unsupported chain" });
    }

    // Get network configuration
    const network = NETWORKS[chain];
    if (!network) {
      return res.status(400).json({ error: "Network configuration not found" });
    }

    // Setup provider and signer for the specified chain
    const chainProvider = new ethers.JsonRpcProvider(network.rpcUrl, {
      chainId: network.chainId,
      name: chain
    });
    const chainSigner = new ethers.Wallet(network.privateKey, chainProvider);

    // Get escrow contract instance
    const escrowContract = new ethers.Contract(
      ESCROW_ADDRESSES[chain],
      TokenEscrowABI,
      chainSigner
    );
    
    let tx;
    if (tokenSymbol === 'MON' && chain === 'monad') {
      // MON is the native currency on Monad.
      
      // Check native MON balance first
      const balance = await chainProvider.getBalance(sellerAddress);
      if (balance < amountInTokenUnits) {
        return res.status(400).json({
          error: "Insufficient MON balance",
          required: ethers.formatUnits(amountInTokenUnits, 18),
          current: ethers.formatUnits(balance, 18),
          token: "MON"
        });
      }

      console.log(`Locking ${ethers.formatUnits(amountInTokenUnits, 18)} native MON in escrow...`);
      // Lock native MON in escrow by sending it with the transaction
      try {
        tx = await escrowContract.lockNative({ value: amountInTokenUnits });
      } catch (error) {
        console.error("Error locking native MON:", error);
        return res.status(400).json({
          error: "Failed to lock native MON",
          message: "Transaction failed. Make sure you have enough MON for the amount and gas.",
          details: error.message
        });
      }

    } else {
      // For ERC20 tokens (USDC, or MON on other chains if it were an ERC20)
      const tokenAddress = TOKEN_ADDRESSES[chain]?.[tokenSymbol];
      if (!tokenAddress) {
        return res.status(400).json({ error: `${tokenSymbol} not supported on ${chain}` });
      }
      
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        chainSigner
      );

      // Check USDC balance first
      const balance = await tokenContract.balanceOf(sellerAddress);
      if (balance < amountInTokenUnits) {
        return res.status(400).json({
          error: "Insufficient USDC balance",
          required: ethers.formatUnits(amountInTokenUnits, 6),
          current: ethers.formatUnits(balance, 6),
          token: "USDC"
        });
      }

      // Check current allowance
      const allowance = await tokenContract.allowance(sellerAddress, ESCROW_ADDRESSES[chain]);
      if (allowance < amountInTokenUnits) {
        console.log(`Approving ${ethers.formatUnits(amountInTokenUnits, 6)} USDC for escrow...`);
        try {
          // Approve USDC spending
          const approveTx = await tokenContract.approve(ESCROW_ADDRESSES[chain], amountInTokenUnits);
          console.log(`Approval transaction sent: ${approveTx.hash}`);
          const approveReceipt = await approveTx.wait();
          console.log(`Approval successful: ${approveReceipt.hash}`);
        } catch (error) {
          return res.status(400).json({
            error: "USDC approval failed",
            message: "Failed to approve USDC spending. Make sure you have enough USDC and gas.",
            details: error.message
          });
        }
      }

      // Verify the new allowance
      const newAllowance = await tokenContract.allowance(sellerAddress, ESCROW_ADDRESSES[chain]);
      if (newAllowance < amountInTokenUnits) {
        return res.status(400).json({
          error: "Approval verification failed",
          message: "USDC approval was not successful",
          required: ethers.formatUnits(amountInTokenUnits, 6),
          current: ethers.formatUnits(newAllowance, 6),
          token: "USDC"
        });
      }

      // Lock USDC in escrow
      console.log(`Locking ${ethers.formatUnits(amountInTokenUnits, 6)} USDC in escrow...`);
      tx = await escrowContract.lockTokens(tokenAddress, amountInTokenUnits);
    }
    const receipt = await tx.wait();

    // Find the TokensLocked event
    const event = receipt.logs.find(
      log => log.topics[0] === ethers.id("TokensLocked(address,address,uint256)")
    );

    res.json({
      success: true,
      transactionHash: receipt.hash,
      escrowAddress: ESCROW_ADDRESSES[chain],
      chain: chain,
      event: event ? {
        user: event.topics[1],
        token: event.topics[2],
        amount: ethers.formatUnits(event.data, tokenSymbol === 'USDC' ? 6 : 18) // USDC uses 6 decimals, MON uses 18
      } : null
    });

  } catch (error) {
    console.error("Error in /lock:", error);
    res.status(500).json({
      error: error.message,
      details: error.reason || "Transaction failed"
    });
  }
});

// Start the API server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Payment API Server running on port ${PORT}`);
  console.log(`📡 Connected to Monad testnet`);
  console.log(`💰 Payment Contract: ${paymentContractAddress}`);
  console.log(`👛 Your wallet: ${signer.address}`);
  console.log(`\n📍 Available endpoints:`);
  console.log(`   POST /sendPayment - Send MON payments`);
  console.log(`   POST /lock - Lock tokens in escrow`);
  console.log(`   GET  /my-balance - Check your wallet's MON balance`);
  console.log(`   GET  /balance/:address - Check any address MON balance`);
  console.log(`   GET  /network-info - Get network information`);
  console.log(`\n🔒 Escrow contracts:`);
  for (const [chain, address] of Object.entries(ESCROW_ADDRESSES)) {
    console.log(`   ${chain}: ${address}`);
}
});