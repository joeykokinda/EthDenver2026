const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Escrow = await hre.ethers.getContractFactory("JobBoardEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("JobBoardEscrow deployed to:", escrowAddr);

  const Rep = await hre.ethers.getContractFactory("Reputation");
  const reputation = await Rep.deploy(escrowAddr);
  await reputation.waitForDeployment();
  const repAddr = await reputation.getAddress();
  console.log("Reputation deployed to:", repAddr);

  // Output for sim/app config
  console.log("\n--- Copy to .env ---");
  console.log(`ESCROW_ADDRESS=${escrowAddr}`);
  console.log(`REPUTATION_ADDRESS=${repAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
