/**
 * Deploys contracts to local Hardhat node and writes addresses to .env
 * Run: node deploy-local.js (with Hardhat node running on :8545)
 */
import { ethers, ContractFactory } from "ethers";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { RPC_URL, HARDHAT_ACCOUNTS } from "./config.js";

const escrowArtifact = JSON.parse(
  readFileSync("../contracts/artifacts/contracts/JobBoardEscrow.sol/JobBoardEscrow.json", "utf8")
);
const repArtifact = JSON.parse(
  readFileSync("../contracts/artifacts/contracts/Reputation.sol/Reputation.json", "utf8")
);

async function deploy(artifact, signer, args = []) {
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  // Use different accounts for each deploy to avoid nonce issues
  const deployer1 = new ethers.Wallet(HARDHAT_ACCOUNTS[0], provider);
  const deployer2 = new ethers.Wallet(HARDHAT_ACCOUNTS[1], provider);

  console.log(`Deploying to ${RPC_URL}`);

  const escrow = await deploy(escrowArtifact, deployer1);
  const escrowAddr = await escrow.getAddress();
  console.log("JobBoardEscrow:", escrowAddr);

  const reputation = await deploy(repArtifact, deployer2, [escrowAddr]);
  const repAddr = await reputation.getAddress();
  console.log("Reputation:", repAddr);

  // Write .env
  const envContent = `ESCROW_ADDRESS=${escrowAddr}\nREPUTATION_ADDRESS=${repAddr}\n`;
  let existing = "";
  if (existsSync(".env")) {
    existing = readFileSync(".env", "utf8")
      .split("\n")
      .filter((l) => !l.startsWith("ESCROW_ADDRESS") && !l.startsWith("REPUTATION_ADDRESS"))
      .join("\n");
  }
  writeFileSync(".env", existing + envContent);
  console.log("Wrote addresses to .env");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
