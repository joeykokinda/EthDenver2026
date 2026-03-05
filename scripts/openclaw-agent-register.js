/**
 * openclaw-agent-register.js
 *
 * This IS the OpenClaw agent registration flow.
 * Drop this into any OpenClaw project to register on Veridex.
 *
 * What it does autonomously:
 *   1. Checks if already registered (idempotent — safe to run multiple times)
 *   2. Calls POST /api/agent/challenge to get a timed nonce (5s window)
 *   3. Signs the nonce with its own private key (~50ms)
 *   4. Calls POST /api/agent/sign with the signed nonce to get a registry signature
 *   5. Calls registerVerified() on Hedera — agent's own key signs the tx
 *   6. Prints verifiedMachineAgent: true + HashScan link
 *
 * The challenge-response proves the registrant is running automated code.
 * A human cannot compute a secp256k1 signature manually within the 5s window.
 *
 * Usage:
 *   AGENT_PRIVATE_KEY=0x... node scripts/openclaw-agent-register.js
 *
 * Or with all options:
 *   AGENT_PRIVATE_KEY=0x... \
 *   AGENT_NAME="MyBot" \
 *   AGENT_DESCRIPTION="Autonomous trading agent" \
 *   AGENT_CAPABILITIES="trading, analysis" \
 *   VERIDEX_API=https://api.veridex.xyz \
 *   node scripts/openclaw-agent-register.js
 */

require("dotenv").config();
const { ethers } = require("ethers");

const CONTRACT  = process.env.AGENT_VERIFIED_IDENTITY_CONTRACT || "0x0874571bAfe20fC5F36759d3DD3A6AD44e428250";
const RPC       = "https://testnet.hashio.io/api";
const API       = process.env.VERIDEX_API || "http://localhost:3001";

const IDENTITY_ABI = [
  "function registerVerified(string name, string description, string capabilities, bytes signature) external",
  "function isRegistered(address) external view returns (bool)",
  "function isVerified(address) external view returns (bool)",
  "function getAgent(address) external view returns (tuple(string name, string description, string capabilities, uint256 registeredAt, bool active, bool verifiedMachineAgent, uint256 jobsCompleted, uint256 jobsFailed, uint256 totalEarned, uint256 reputationScore, uint256 totalRatings))"
];

async function main() {
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: AGENT_PRIVATE_KEY not set in environment");
    console.error("Usage: AGENT_PRIVATE_KEY=0x... node scripts/openclaw-agent-register.js");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet   = new ethers.Wallet(privateKey, provider);
  const identity = new ethers.Contract(CONTRACT, IDENTITY_ABI, wallet);

  const name         = process.env.AGENT_NAME         || "OpenClawAgent";
  const description  = process.env.AGENT_DESCRIPTION  || "An autonomous OpenClaw agent on Veridex";
  const capabilities = process.env.AGENT_CAPABILITIES || "autonomous, on-chain, Hedera";

  console.log("\n=== Veridex Registration ===");
  console.log("Agent address:", wallet.address);
  console.log("Contract:     ", CONTRACT);
  console.log("Network:       Hedera Testnet\n");

  // ── Check if already registered ──────────────────────────────────────────
  const already = await identity.isRegistered(wallet.address);
  if (already) {
    const profile = await identity.getAgent(wallet.address);
    const verified = await identity.isVerified(wallet.address);
    console.log(`Already registered as "${profile.name}"`);
    console.log("  verifiedMachineAgent:", verified);
    console.log(`  HashScan: https://hashscan.io/testnet/account/${wallet.address}`);
    if (!verified) {
      console.log("\n  This agent is registered but NOT verified.");
      console.log("  To upgrade, unregister first then re-run this script.");
    }
    return;
  }

  // ── Step 1: Request challenge — 5-second clock starts ────────────────────
  console.log("Step 1: Requesting challenge from Veridex...");
  console.log(`  POST ${API}/api/agent/challenge`);

  let challenge;
  try {
    const res = await fetch(`${API}/api/agent/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: wallet.address })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API returned ${res.status}: ${err}`);
    }

    const data = await res.json();
    challenge = data.challenge;
    console.log("  Challenge received:", challenge.slice(0, 16) + "...");
    console.log("  Expires in:        ", data.expiresIn);
  } catch (err) {
    console.error("\n  Could not reach Veridex API:", err.message);
    console.error("  Make sure the orchestrator is running: node orchestrator/index.js");
    process.exit(1);
  }

  // ── Step 2: Sign challenge and claim registry signature ───────────────────
  console.log("\nStep 2: Signing challenge and claiming registry signature...");
  console.log(`  POST ${API}/api/agent/sign`);

  let signature;
  try {
    const challengeSignature = await wallet.signMessage(challenge);
    const elapsed1 = Date.now();

    const res = await fetch(`${API}/api/agent/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: wallet.address, challengeSignature })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `API returned ${res.status}`);
    }

    const data = await res.json();
    signature = data.registrySignature;
    console.log("  Completed in:      ", data.elapsed);
    console.log("  Registry authority:", data.registryAuthority);
  } catch (err) {
    console.error("\n  Challenge-response failed:", err.message);
    process.exit(1);
  }

  // ── Step 3: Register on-chain with valid signature ────────────────────────
  console.log("\nStep 3: Registering on Hedera (agent signs this tx with its own key)...");
  console.log(`  name:         ${name}`);
  console.log(`  description:  ${description}`);
  console.log(`  capabilities: ${capabilities}`);

  try {
    const tx = await identity.registerVerified(name, description, capabilities, signature);
    console.log("  Tx submitted:", tx.hash);
    console.log("  Waiting for confirmation...");
    const receipt = await tx.wait();

    const profile = await identity.getAgent(wallet.address);
    const verified = await identity.isVerified(wallet.address);

    console.log("\n✓ Registration complete!");
    console.log("  name:                ", profile.name);
    console.log("  verifiedMachineAgent:", verified);
    console.log("  Tx hash:             ", receipt.hash);

    // Resolve HashScan transaction URL via Mirror Node timestamp
    let hashScanTxUrl = `https://hashscan.io/testnet/transaction/${receipt.hash}`;
    try {
      const mirrorRes = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/contracts/results/${receipt.hash}`);
      if (mirrorRes.ok) {
        const mirrorData = await mirrorRes.json();
        if (mirrorData.timestamp) {
          hashScanTxUrl = `https://hashscan.io/testnet/transaction/${mirrorData.timestamp}/result`;
        }
      }
    } catch {}

    console.log("  HashScan (tx):       ", hashScanTxUrl);
    console.log("  HashScan (account):  ", `https://hashscan.io/testnet/account/${wallet.address}`);
    console.log("\nThis agent is now trusted on Veridex.");
    console.log("Other agents will see verifiedMachineAgent: true before transacting with you.\n");
  } catch (err) {
    if (err.message?.includes("already registered")) {
      console.log("  Agent already registered — run with a fresh wallet or unregister first.");
    } else {
      console.error("  Transaction failed:", err.message);
    }
    process.exit(1);
  }
}

main();
