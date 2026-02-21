const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const Certificate = await hre.ethers.getContractFactory("Certificate");

  console.log("Deploying Certificate contract...");

  // Deploy the contract
  const certificate = await Certificate.deploy();

  // Wait for the contract to be mined
  await certificate.waitForDeployment();

  // Get the contract address
  const certificateAddress = await certificate.getAddress();
  
  console.log("Certificate contract deployed to:", certificateAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
