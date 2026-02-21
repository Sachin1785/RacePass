const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`Deploying contracts to ${network} network...`);
  
  // Get the contract factories
  const Payment = await hre.ethers.getContractFactory("Payment");
  const Certificate = await hre.ethers.getContractFactory("Certificate");
  
  console.log("Deploying Payment contract...");
  const payment = await Payment.deploy();
  await payment.waitForDeployment();
  const paymentAddress = await payment.getAddress();
  console.log("✅ Payment contract deployed to:", paymentAddress);
  
  console.log("Deploying Certificate contract...");
  const certificate = await Certificate.deploy();
  await certificate.waitForDeployment();
  const certificateAddress = await certificate.getAddress();
  console.log("✅ Certificate contract deployed to:", certificateAddress);
  
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Network: ${network}`);
  console.log(`Payment Address: ${paymentAddress}`);
  console.log(`Certificate Address: ${certificateAddress}`);
  console.log("\n📋 Add these to your .env file:");
  console.log(`PAYMENT_ADDRESS="${paymentAddress}"`);
  console.log(`CERTIFICATE_ADDRESS="${certificateAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});