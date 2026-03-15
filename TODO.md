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
- [x] Homepage — full Veridex v2 rewrite (old identity/marketplace pitch gone)
- [x] `/monitor` page — live feed, agent sidebar, risk filters
- [x] `/monitor/[agentId]` — 4-tab detail (Activity, Earnings, Policies, Alerts) + ERC-8004 reads wired
- [x] Old pages removed — `scanner`, `events` deleted
- [x] All navs updated — Monitor · Agents · Marketplace · skill.md
- [x] `skill.md` — updated with pre/post logging hooks + blocking behavior
- [x] Frontend build — zero errors, 9 routes
- [x] README — full project docs rewritten for Veridex v2
- [x] `veridex.xyz` → `veridex.sbs` everywhere in frontend

---

## 🟡 BUILT — Not yet tested (should work, needs a quick verify)

- [ ] **TradingBot** — written, never run. Start it: `node bots/trading-bot.js`
- [ ] **Real HTS earnings split** — `TransferTransaction` code written in trading-bot, needs live execution to get real tx hash
- [ ] **ERC-8004 reads in browser** — reads from contract on agent detail page, needs browser verify
- [ ] **Telegram module** — code correct, no token yet so never fired
- [ ] **Policies tab** — add/delete blocking rules UI exists, not clicked
- [ ] **Alerts resolve button** — exists in UI, not clicked
- [ ] **Register page** — API base changed to relative proxy, not browser-tested
- [ ] **Dashboard** — nav updated, not browser-refreshed

---

## 🔴 TODO — Must complete before submission

### You do these:

- [ ] **Telegram bot setup** — @BotFather → `/newbot` → "Veridex Alerts" → add to `.env`:
  ```
  TELEGRAM_BOT_TOKEN=...
  TELEGRAM_CHAT_ID=...
  ```
  Test: `curl -X POST http://localhost:3001/api/monitor/telegram/test`

- [ ] **Confirm rogue bot → Telegram alert hits phone** — the demo WOW moment, must see it before recording

- [ ] **Test trading bot HTS split** — `node bots/trading-bot.js`, wait ~60s, check `/monitor/trading-bot-demo` Earnings tab for real tx hash

- [ ] **Pitch deck PDF** — 12 slides (full structure in submission notes):
  - 1: Title · 2: Problem · 3: Solution · 4: How it works · 5: Screenshots
  - 6: Why Hedera · 7: Traction · 8: Business model · 9: GTM · 10: Roadmap · 11: Team · 12: Close

- [ ] **Demo video** — 5 min, upload to YouTube:
  1. Open veridex.sbs — 3 agents, live feed ticking
  2. ResearchBot in /monitor — plain English, HashScan links
  3. Agent detail — timeline, earnings, HCS pay stub
  4. **RogueBot fires — BLOCKED in red, Telegram alert on phone** 🔥
  5. Click blocked entry — HashScan proof permanently on Hedera
  6. Policies tab — add `api.sketchy.com` live
  7. Close: *"Every action, forever on Hedera. Tamper-proof."*

- [ ] **Submit APEX** — hackathon.stackup.dev by March 22 EOD
  - OpenClaw bounty ($8k) + AI & Agents main track ($40k)

- [ ] **Submit Synthesis** — check registration email for portal, by March 22 EOD
  - Protocol Labs ERC-8004 ($8,004) + Open track

- [ ] **ClawHub listing** — post skill to OpenClaw registry for real installs + screenshots

### I do these (say the word):

- [ ] `git commit` everything clean with good messages
- [ ] Update `.env.example` with new vars (Telegram, DB path)
- [ ] Mobile responsive fix on `/monitor` (sidebar breaks on small screens)
- [ ] Vercel config + deployment setup

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
