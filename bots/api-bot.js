#!/usr/bin/env node
/**
 * Veridex Demo Bot — APIBot
 * Simulates an integration agent: webhook delivery, external API calls,
 * third-party service orchestration. Occasionally triggers medium-risk actions.
 * All actions are logged to Veridex via POST /api/log.
 */

const API_BASE = process.env.VERIDEX_API || "http://localhost:3001";
const AGENT_ID   = "api-bot-demo";
const AGENT_NAME = "APIBot";
const OWNER_WALLET = process.env.API_BOT_ADDRESS || "0x16f67cDF5F06F832e9B43E067bfb56e3D4250624";

const API_CALLS = [
  { url: "https://api.coingecko.com/api/v3/simple/price", method: "GET",  label: "fetch HBAR price" },
  { url: "https://testnet.mirrornode.hedera.com/api/v1/transactions", method: "GET",  label: "fetch Hedera txns" },
  { url: "https://api.openclaw.dev/v1/agents/status", method: "GET",  label: "check agent registry" },
  { url: "https://notify.example.com/webhook/alerts", method: "POST", label: "send alert webhook" },
  { url: "https://api.hedera.com/v1/topics/messages", method: "POST", label: "submit HCS message" },
  { url: "https://api.coingecko.com/api/v3/coins/hedera-hashgraph", method: "GET",  label: "fetch HBAR metadata" },
  { url: "https://slack.com/api/chat.postMessage", method: "POST", label: "post Slack notification" },
  { url: "https://api.github.com/repos/openclaw/agents/issues", method: "GET",  label: "check GitHub issues" },
];

const WEBHOOK_PAYLOADS = [
  { event: "agent.action.blocked", severity: "high",   agentId: "rogue-bot-demo" },
  { event: "earnings.split.completed", amount: 2.5,    agentId: "trading-bot-demo" },
  { event: "agent.started", version: "1.4.2",          agentId: "api-bot-demo" },
  { event: "job.completed", jobId: "job-0x1234",       agentId: "research-bot-demo" },
];

// Occasionally probe an external endpoint for rate-limit/auth check (medium risk)
const PROBE_ENDPOINTS = [
  "https://api.external-partner.io/v2/data",
  "https://crm.example.com/api/contacts/export",
  "https://analytics.example.com/api/export?format=json",
];

let sessionId = `api-${Date.now()}`;
let registered = false;

async function log(action, tool, params, phase = "after") {
  try {
    const resp = await fetch(`${API_BASE}/api/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: AGENT_ID, sessionId, action, tool, params, phase, timestamp: Date.now() })
    });
    return await resp.json();
  } catch (e) {
    console.error(`[APIBot] Log error: ${e.message}`);
    return { allowed: true };
  }
}

async function register() {
  try {
    const resp = await fetch(`${API_BASE}/api/agent/register-monitor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: AGENT_ID, name: AGENT_NAME, ownerWallet: OWNER_WALLET })
    });
    const data = await resp.json();
    console.log(`[APIBot] Registered. HCS Topic: ${data.hcsTopicId || "pending"}`);
    if (data.hashScanUrl) console.log(`[APIBot] Audit log: ${data.hashScanUrl}`);
    registered = true;
  } catch (e) {
    console.error(`[APIBot] Registration failed: ${e.message}`);
  }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function doApiCall() {
  const call = pick(API_CALLS);
  console.log(`[APIBot] ${call.method} ${call.label}`);
  await log("api_call", "http_request", { url: call.url, method: call.method }, "before");
  await sleep(150 + Math.random() * 500);
  await log("api_call", "http_request", {
    url: call.url, method: call.method,
    status: 200, bytes: Math.floor(Math.random() * 8000) + 200
  }, "after");
}

async function doWebhook() {
  const payload = pick(WEBHOOK_PAYLOADS);
  const url = "https://notify.example.com/webhook/veridex";
  console.log(`[APIBot] Sending webhook: ${payload.event}`);
  await log("api_call", "http_request", { url, method: "POST", event: payload.event }, "before");
  await sleep(100 + Math.random() * 300);
  await log("api_call", "http_request", { url, method: "POST", status: 200, event: payload.event }, "after");
}

async function doExternalProbe() {
  const url = pick(PROBE_ENDPOINTS);
  console.log(`[APIBot] Probing external: ${url}`);
  const r = await log("api_call", "http_request", { url, method: "GET", external: "true" }, "before");
  if (!r.allowed) {
    console.log(`[APIBot] Blocked: ${r.reason}`);
    return;
  }
  await sleep(400 + Math.random() * 600);
  await log("api_call", "http_request", {
    url, method: "GET", status: 401,
    error: "Unauthorized — rate limit or auth required"
  }, "after");
}

async function tick() {
  const r = Math.random();
  if (r < 0.50)      await doApiCall();
  else if (r < 0.80) await doWebhook();
  else               await doExternalProbe();
}

async function main() {
  console.log(`[APIBot] Starting up...`);
  await register();
  console.log(`[APIBot] Running — logging every 50s`);
  await tick();
  setInterval(tick, 50000);
}

main().catch(console.error);
