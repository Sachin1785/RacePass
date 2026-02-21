const hre = require("hardhat");

async function main() {
  // Get the contract factory for your Payment contract
  const Payment = await hre.ethers.getContractFactory("Payment");
  
  console.log("Deploying Payment contract...");
  
  // Deploy the contract
  const payment = await Payment.deploy();
  
  // In newer versions, we simply wait for the transaction to be mined
  await payment.waitForDeployment();
  
  // Get the deployed contract address
  const paymentAddress = await payment.getAddress();
  
  console.log("Payment contract deployed to:", paymentAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
