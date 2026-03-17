#!/usr/bin/env node
/**
 * setup-databots.js
 * Fund, register on-chain, and register with Veridex monitor for DataBot and APIBot.
 * Run once: node scripts/setup-databots.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { ethers } = require("ethers");

const PROVIDER_URL   = "https://testnet.hashio.io/api";
const API_BASE       = process.env.VERIDEX_API || "http://localhost:3001";
const IDENTITY_ADDR  = process.env.AGENT_IDENTITY_CONTRACT;

const AgentIdentity  = require("../artifacts/contracts/AgentIdentity.sol/AgentIdentity.json");

const BOTS = [
  {
    agentId:     "data-bot-demo",
    name:        "DataBot",
    description: "Data pipeline agent — DB queries, file processing, CSV exports",
    capabilities:"file_read,file_write,shell_exec,api_call",
    privateKey:  process.env.DATA_BOT_PRIVATE_KEY,
    address:     process.env.DATA_BOT_ADDRESS,
  },
  {
    agentId:     "api-bot-demo",
    name:        "APIBot",
    description: "Integration agent — webhook delivery, external API calls, service orchestration",
    capabilities:"api_call,web_search",
    privateKey:  process.env.API_BOT_PRIVATE_KEY,
    address:     process.env.API_BOT_ADDRESS,
  },
];

async function setupBot(bot) {
  console.log(`\n── Setting up ${bot.name} (${bot.address}) ──`);

  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
  const wallet   = new ethers.Wallet(bot.privateKey, provider);

  // 1. Fund via faucet
  console.log("  Requesting HBAR from faucet...");
  try {
    const r = await fetch(`${API_BASE}/api/faucet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: bot.address }),
    }).then(r => r.json());
    if (r.success) console.log(`  Funded: ${r.amount} (${r.newBalance})`);
    else if (r.alreadyFunded) console.log(`  Already funded: ${r.balance}`);
    else console.log("  Faucet:", r.message || r.error);
  } catch (e) {
    console.log("  Faucet error:", e.message);
  }

  // 2. Check if already registered on-chain
  const identity = new ethers.Contract(IDENTITY_ADDR, AgentIdentity.abi, provider);
  const alreadyReg = await identity.isRegistered(bot.address).catch(() => false);
  if (alreadyReg) {
    console.log("  Already registered on AgentIdentity contract");
  } else {
    // 3. Challenge-sign flow to get registry signature
    console.log("  Getting challenge...");
    const { challenge } = await fetch(`${API_BASE}/api/agent/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: bot.address }),
    }).then(r => r.json());

    const challengeSignature = await wallet.signMessage(challenge);

    const { registrySignature, error: signErr } = await fetch(`${API_BASE}/api/agent/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: bot.address, challengeSignature }),
    }).then(r => r.json());

    if (signErr) throw new Error(`Sign failed: ${signErr}`);

    // 4. Register on-chain via registerVerified
    console.log("  Registering on AgentIdentity contract...");
    const identityWithSigner = identity.connect(wallet);
    const tx = await identityWithSigner.registerVerified(
      bot.name, bot.description, bot.capabilities, registrySignature
    );
    await tx.wait();
    console.log(`  Registered on-chain: ${tx.hash}`);
  }

  // 5. Register with Veridex monitor (creates HCS topic)
  console.log("  Registering with Veridex monitor...");
  const monResult = await fetch(`${API_BASE}/api/agent/register-monitor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId:     bot.agentId,
      name:        bot.name,
      ownerWallet: bot.address,
    }),
  }).then(r => r.json());

  console.log(`  HCS Topic: ${monResult.hcsTopicId}`);
  console.log(`  HashScan:  ${monResult.hashScanUrl}`);
  console.log(`  ✓ ${bot.name} ready`);
}

(async () => {
  if (!process.env.DATA_BOT_PRIVATE_KEY || !process.env.API_BOT_PRIVATE_KEY) {
    console.error("Missing DATA_BOT_PRIVATE_KEY or API_BOT_PRIVATE_KEY in .env");
    process.exit(1);
  }
  if (!IDENTITY_ADDR) {
    console.error("Missing AGENT_IDENTITY_CONTRACT in .env");
    process.exit(1);
  }

  console.log("Veridex DataBot + APIBot Setup");
  console.log("Orchestrator:", API_BASE);

  for (const bot of BOTS) {
    await setupBot(bot);
    if (bot !== BOTS[BOTS.length - 1]) await new Promise(r => setTimeout(r, 3000));
  }

  console.log("\n✓ All bots set up. Start them with:");
  console.log("  node bots/data-bot.js");
  console.log("  node bots/api-bot.js");
})();
