const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Starting deployment on network:", hre.network.name);

    // 1. Get singers
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // 2. Deploy Identity Contract
    console.log("\nDeploying RacePassIdentity...");
    const Identity = await ethers.getContractFactory("RacePassIdentity");
    const identity = await Identity.deploy(deployer.address);
    await identity.waitForDeployment();
    const identityAddress = await identity.getAddress();
    console.log("-> RacePassIdentity deployed at:", identityAddress);

    // 3. Deploy Ticket Contract
    console.log("\nDeploying RacePassTicket...");
    const Ticket = await ethers.getContractFactory("RacePassTicket");
    const ticket = await Ticket.deploy(deployer.address, identityAddress);
    await ticket.waitForDeployment();
    const ticketAddress = await ticket.getAddress();
    console.log("-> RacePassTicket deployed at:", ticketAddress);

    // 4. Deploy Paymaster Contract
    console.log("\nDeploying RacePassPaymaster...");
    // A dummy entry point address for testnet (if standard ERC-4337 is deployed, use its address)
    // Here we'll just mock one for Monad Testnet or use generic zero address for testing.
    const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

    // Require at least 50 reputation for gasless entry
    const MIN_REP_FOR_GASLESS = 50;

    const Paymaster = await ethers.getContractFactory("RacePassPaymaster");
    const paymaster = await Paymaster.deploy(ENTRY_POINT, identityAddress, MIN_REP_FOR_GASLESS);
    await paymaster.waitForDeployment();
    const paymasterAddress = await paymaster.getAddress();
    console.log("-> RacePassPaymaster deployed at:", paymasterAddress);

    console.log("\nDeployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error during deployment:", error);
        process.exit(1);
    });
