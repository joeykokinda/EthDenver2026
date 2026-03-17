#!/usr/bin/env node
/**
 * Veridex Demo Bot — DataBot
 * Simulates a data pipeline agent: database queries, file processing, CSV exports.
 * Occasionally triggers medium-risk actions (shell commands, large file writes).
 * All actions are logged to Veridex via POST /api/log.
 */

const API_BASE = process.env.VERIDEX_API || "http://localhost:3001";
const AGENT_ID   = "data-bot-demo";
const AGENT_NAME = "DataBot";
const OWNER_WALLET = "0x53776769f4b9554c51D0852a1Cb11C1eaB4b92AD"; // ResearchBot wallet

const DB_QUERIES = [
  "SELECT * FROM transactions WHERE date > '2026-01-01' LIMIT 1000",
  "SELECT agent_id, COUNT(*) as actions FROM logs GROUP BY agent_id",
  "SELECT SUM(amount_hbar) FROM earnings WHERE timestamp > ?",
  "SELECT * FROM market_prices WHERE symbol = 'HBAR' ORDER BY timestamp DESC LIMIT 100",
  "UPDATE pipeline_status SET status = 'running' WHERE job_id = ?",
  "INSERT INTO report_cache (key, value, expires) VALUES (?, ?, ?)",
];

const FILES_TO_READ = [
  "/tmp/pipeline-input.csv",
  "/tmp/market-data.json",
  "/tmp/agent-metrics.log",
  "/var/data/hedera-transactions.parquet",
];

const FILES_TO_WRITE = [
  "/tmp/report-2026-03.csv",
  "/tmp/processed-data.json",
  "/tmp/earnings-summary.txt",
  "/tmp/pipeline-output.parquet",
];

const SHELL_COMMANDS = [
  "python3 scripts/process_pipeline.py --input /tmp/data.csv",
  "gzip -c /tmp/report.csv > /tmp/report.csv.gz",
  "wc -l /tmp/pipeline-output.parquet",
  "jq '.transactions[]' /tmp/market-data.json | head -20",
];

let sessionId = `data-${Date.now()}`;
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
    console.error(`[DataBot] Log error: ${e.message}`);
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
    console.log(`[DataBot] Registered. HCS Topic: ${data.hcsTopicId || "pending"}`);
    if (data.hashScanUrl) console.log(`[DataBot] Audit log: ${data.hashScanUrl}`);
    registered = true;
  } catch (e) {
    console.error(`[DataBot] Registration failed: ${e.message}`);
  }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function doDbQuery() {
  const query = pick(DB_QUERIES);
  console.log(`[DataBot] Query: ${query.slice(0, 50)}...`);
  await log("api_call", "db_query", { query, database: "veridex_analytics" }, "before");
  await sleep(200 + Math.random() * 600);
  await log("api_call", "db_query", { query, rows: Math.floor(Math.random() * 5000) + 1, elapsed_ms: 120 }, "after");
}

async function doFileRead() {
  const path = pick(FILES_TO_READ);
  console.log(`[DataBot] Reading: ${path}`);
  await log("file_read", "file_read", { path }, "before");
  await sleep(100 + Math.random() * 300);
  await log("file_read", "file_read", { path, bytes: Math.floor(Math.random() * 500000) + 10000 }, "after");
}

async function doFileWrite() {
  const path = pick(FILES_TO_WRITE);
  const rows = Math.floor(Math.random() * 10000) + 100;
  console.log(`[DataBot] Writing: ${path} (${rows} rows)`);
  await log("file_write", "file_write", { path, rows, format: "csv" }, "before");
  await sleep(300 + Math.random() * 700);
  await log("file_write", "file_write", { path, bytes: rows * 128 }, "after");
}

async function doShellCommand() {
  const command = pick(SHELL_COMMANDS);
  console.log(`[DataBot] Shell: ${command.slice(0, 40)}...`);
  const r = await log("shell_exec", "bash", { command }, "before");
  if (!r.allowed) {
    console.log(`[DataBot] Shell blocked: ${r.reason}`);
    return;
  }
  await sleep(800 + Math.random() * 1200);
  await log("shell_exec", "bash", { command, exit_code: 0, output_lines: 42 }, "after");
}

async function tick() {
  const r = Math.random();
  if (r < 0.35)      await doDbQuery();
  else if (r < 0.55) await doFileRead();
  else if (r < 0.75) await doFileWrite();
  else               await doShellCommand();
}

async function main() {
  console.log(`[DataBot] Starting up...`);
  await register();
  console.log(`[DataBot] Running — logging every 45s`);
  await tick();
  setInterval(tick, 45000);
}

main().catch(console.error);
