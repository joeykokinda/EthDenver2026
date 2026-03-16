# Veridex — TODO

Deadline: **March 22 2026 EOD** (submit by end of day, March 23 is official cutoff)

---

## ✅ DONE — Fully Working (verified)

- [x] HCS topic creation — `0.0.8228708` (Research), `0.0.8228710` (Trading), `0.0.8228711` (Rogue) live on Hedera
- [x] HCS message writing — mirror node confirmed seq#5 = blocked `/etc/passwd` permanently on-chain
- [x] `POST /api/log` — allow + block paths both verified end-to-end
- [x] Blocking layer — shell exploits, secret leak detection, loop detection, custom policies
- [x] SQLite DB — all 5 tables (agents, logs, alerts, policies, earnings)
- [x] All 3 demo bots registered on Hedera (`verifiedMachineAgent: true`, rep 500, funded)
- [x] ResearchBot — runs, logs to HCS with sequence numbers
- [x] RogueBot — runs, blocked actions confirmed on HCS at seq#5 + seq#10
- [x] `/api/monitor/overview` endpoint — returns live counts
- [x] SSE `/feed/live` — streams real-time decoded logs
- [x] `skill.md` — updated with pre/post logging hooks + blocking behavior
- [x] README — full project docs rewritten for Veridex v2

### Frontend — all 12 routes building clean
- [x] `/` — homepage with LiveFeedDemo (SSE), live stats bar, problem/solution sections, install snippet
- [x] `/dashboard` — wallet-gated agent cards (status dot, last action, stat pills, HCS link); empty state with add prompt; demo mode
- [x] `/dashboard/add` — 3-step wizard: wallet model → configure (name, ID, split %) → success + code snippet
- [x] `/dashboard/[agentId]` — 5-tab detail: Activity (live SSE + filter bar), Jobs, Earnings, Policies (add/delete rules + alerts), Recovery (Hedera HCS memory)
- [x] `/leaderboard` — sortable table, ERC-8004 rep scores from chain, HashScan links
- [x] Shared `Nav` component — Logo | Dashboard | Leaderboard | Connect Wallet (MetaMask)
- [x] `WalletProvider` — MetaMask connect/disconnect, localStorage persistence, wallet-gated pages

### Backend — all endpoints live
- [x] `POST /api/log` — auto-creates agent record if unknown, blocks, logs to HCS
- [x] `POST /api/agent/register-monitor` — registers agent + creates HCS topic
- [x] `GET /api/monitor/agents?wallet=` — returns agents by owner wallet
- [x] `GET /api/monitor/agent/:id/stats` — agent + stats + earnings + alerts
- [x] `GET /api/monitor/agent/:id/feed` — log history
- [x] `GET /api/monitor/agent/:id/policies` — blocking rules
- [x] `POST /api/monitor/agent/:id/policy` + `DELETE` — add/remove rules
- [x] `GET /api/leaderboard` — all agents sorted by rep
- [x] `POST /api/monitor/telegram/test` — test alert endpoint (code exists, needs token)
- [x] `GET /v2/agent/:agentId/memory` — reads Hedera Mirror Node, returns structured recovery context
- [x] `POST /v2/vault/store` + `/list` + `/request` + `/delete` — encrypted secrets vault
- [x] `GET /v2/jobs` + `/v2/jobs/agent/:address` — ERC-8183 job monitor

### Layers
- [x] LAYER 1: Secrets Vault — AES-256-GCM, 60s scoped tokens, never exposes raw secret
- [x] LAYER 4: ERC-8183 Job Monitor — polls marketplace events, stuck job detection
- [x] LAYER 5: Earnings — split history, HTS tx links
- [x] LAYER 8: Verifiable Operational History — HCS-anchored agent memory, crash recovery

---

## 🟡 NEEDS TESTING — Code exists, not verified in browser

- [ ] **Activity tab on /dashboard/[agentId]** — calls `/stats` + `/feed` + `/policies` in parallel; verify data loads correctly
- [ ] **Recovery tab** — calls `/v2/agent/:id/memory`, reads Mirror Node; verify HCS messages show up
- [ ] **Add Agent wizard** — 3 steps, register via POST, success screen with HCS topic; step through in browser
- [ ] **Policies add/delete** — add a domain block, verify it shows in list and actually blocks in `/api/log`
- [ ] **TradingBot** — written, never run: `node bots/trading-bot.js`
- [ ] **ERC-8004 reads in leaderboard** — fetches rep scores from chain on load; needs browser verify
- [ ] **Wallet connect on dashboard** — connect MetaMask → agents filtered by wallet; verify filter works

---

## 🔴 TODO — Must complete before submission

### One code fix needed (I do this):

- [ ] **Auto-create HCS topic on first `/api/log`** — currently `POST /api/log` creates the agent DB record but NOT an HCS topic when agent is unknown. This means external agents that skip `/register-monitor` get no audit trail. Fix: when auto-creating, also call `createAgentTopic()` async, same as register-monitor does.
  - Why it matters: the whole pitch is "install skill, your agent is audited immediately" — if the HCS topic isn't created on first action, that's broken

### You do these:

- [ ] **Telegram bot setup** — @BotFather → `/newbot` → "Veridex Alerts" → add to `.env`:
  ```
  TELEGRAM_BOT_TOKEN=...
  TELEGRAM_CHAT_ID=...
  ```
  Test: `curl -X POST http://localhost:3001/api/monitor/telegram/test`

- [ ] **Confirm rogue bot → Telegram alert hits phone** — the demo WOW moment, must see it before recording

- [ ] **Test trading bot HTS split** — `node bots/trading-bot.js`, wait ~60s, check `/dashboard/trading-bot-demo` Earnings tab for real tx hash

- [ ] **Pitch deck PDF** — 12 slides:
  - 1: Title · 2: Problem (.env secrets in plaintext) · 3: Solution (7-layer control plane) · 4: How it works
  - 5: Screenshots (dashboard + blocked action + HashScan proof) · 6: Why Hedera (tamper-proof)
  - 7: Verifiable memory demo · 8: Business model · 9: GTM · 10: Roadmap · 11: Team · 12: Close

- [ ] **Demo video** — 5 min, upload to YouTube:
  1. Open veridex.sbs — agents live, feed ticking on homepage
  2. Connect wallet → Dashboard → your agents
  3. Click ResearchBot — Activity tab live, HashScan links
  4. **RogueBot fires — BLOCKED in red, Telegram alert on phone** 🔥
  5. Click blocked entry → HashScan proof permanently on Hedera
  6. Policies tab — add `api.sketchy.com` live on camera
  7. Recovery tab → restart bot → reads memory from Hedera → "knows what not to try again"
  8. Close: *"Every action, forever on Hedera. Tamper-proof. The agent's memory is the blockchain."*

- [ ] **Submit APEX** — hackathon.stackup.dev by March 22 EOD
  - OpenClaw bounty ($8k) + AI & Agents main track ($40k)

- [ ] **Submit Synthesis** — check registration email for portal, by March 22 EOD
  - Protocol Labs ERC-8004 ($8,004) + Open track

- [ ] **ClawHub listing** — post skill to OpenClaw registry for real installs + screenshots

### I do these (say the word):

- [ ] `git commit` everything clean with good messages
- [ ] Auto-create HCS topic fix in `/api/log` (see above)
- [ ] Mobile responsive fix — `/dashboard` sidebar breaks on small screens
- [ ] Vercel deployment setup + env var guide

---

## 🚀 Deployment

**Architecture: Vercel (frontend) + your server (orchestrator + bots)**

### Vercel — one env var to set in dashboard:
```
ORCHESTRATOR_URL=https://your-vps-or-ngrok-url:3001
```
Everything else is already in `app/.env.production`.

### Deploy frontend:
```bash
cd app
npx vercel --prod
# Then: Vercel dashboard → Settings → Environment Variables → add ORCHESTRATOR_URL
```

### Server (VPS/your machine — keep running):
```bash
node orchestrator/index.js &
node bots/research-bot.js &
node bots/trading-bot.js &
node bots/rogue-bot.js &
```

---

## Submission checklist

- [ ] GitHub repo (public, commits dated Feb 17 – Mar 23)
- [ ] Live demo URL: veridex.sbs
- [ ] Demo video URL (YouTube, max 5 min)
- [ ] Pitch deck PDF
- [ ] 100-word description (written — see README)
- [ ] Tech stack listed: Hedera HCS · HTS · Agent Kit · ERC-8004 · ERC-8183 · Node.js · Next.js · SQLite · ethers.js
