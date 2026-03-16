# Veridex — TODO

---

## ✅ DONE — Verified working

- [x] HCS topics live — `0.0.8228708` (Research) · `0.0.8228710` (Trading) · `0.0.8228711` (Rogue)
- [x] HCS message writing — mirror node confirms real seq numbers on all 3 topics
- [x] `POST /api/log` — allow + block paths end-to-end, auto-creates agent record if unknown
- [x] Blocking layer — shell exploits, secret leak detection, loop detection, custom policies, quarantine
- [x] SQLite DB — agents, logs, alerts, policies, earnings, jobs, vault tables
- [x] All 3 demo bots — real EVM addresses, `verifiedMachineAgent: true`, rep 500, funded (~1.7 HBAR each)
- [x] ResearchBot / TradingBot / RogueBot — running, logging to HCS with real sequence numbers
- [x] HCS pay stubs — earnings_split writes dedicated paystub to HCS, seq number stored in earnings table (verified seq #674)
- [x] ERC-8004 reads — all 3 bots use real wallet addresses, `getAgent()` returns rep 500 / verified from chain
- [x] SSE `/feed/live` — streams real-time decoded logs
- [x] Telegram alerts — fires on blocked actions (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env)
- [x] Telegram bot — `/agents` `/logs` `/block` `/unblock` `/status` `/memory` commands, polling mode, chat ID security
- [x] `GET /v2/agent/:agentId/memory` — reads Hedera Mirror Node, returns structured recovery context
- [x] `POST /v2/vault/store` + request + delete — AES-256-GCM encrypted secrets, 60s scoped tokens
- [x] `GET /api/monitor/overview` · `/stats` · `/feed` · `/policies` · `/alerts` · `/leaderboard` — all working
- [x] Frontend — 12 routes, zero build errors
  - [x] `/` — homepage, LiveFeedDemo SSE, live stats bar, install snippet
  - [x] `/dashboard` — wallet-gated, agent cards, demo mode, empty state
  - [x] `/dashboard/add` — 3-step wizard: wallet model → configure → success + code snippet
  - [x] `/dashboard/[agentId]` — 5 tabs: Activity (live + filter), Jobs, Earnings, Policies, Recovery
  - [x] `/leaderboard` — ERC-8004 rep scores from chain, HashScan links
  - [x] Shared `Nav` — MetaMask connect/disconnect, wallet-gated pages
- [x] `skill.md` v4.0 — pre/post logging hooks, Step 0 memory recovery, Step 1 vault capability request
- [x] README — full project docs

---

## 🔴 CODE — Claude Code does these (say the word)

- [ ] **Fix SSE proxy** — `/api/proxy/feed/live` calls `res.json()` which breaks streaming. The live feed on the homepage and Activity tab won't update in real-time through the Next.js proxy. Fix: add a dedicated streaming handler for `/feed/live` route that pipes the SSE response instead of parsing JSON.

- [ ] **Auto-create HCS topic on first `/api/log`** — when an unknown agent hits `/api/log`, the backend creates a DB record but NOT an HCS topic. External agents that skip `/register-monitor` get no audit trail. Fix: call `createAgentTopic()` async when auto-creating an unknown agent, same as `register-monitor` does.

- [ ] **OpenClaw skill.md audit** — verify the pre-execute instructions are explicit enough for a real OpenClaw agent to follow without any code changes. The agent needs to know: exact JSON shape to POST, what `allowed: false` means, how to handle the response. Add a working curl example. Make the integration copy-paste.

- [ ] **`GET /v2/demo` endpoint** — fires a sample blocked action through the full stack (POST /api/log → block → HCS write → Telegram alert) and returns the result with HCS sequence number and HashScan link. Lets judges verify the integration works from their browser in one click without needing OpenClaw installed.

- [ ] **Rogue bot rep decrement** — after each blocked action, call `updateReputation()` on the AgentIdentity contract to lower RogueBot's ERC-8004 score. Right now all 3 bots sit at 500 forever which looks static. Even dropping rogue-bot to ~320 after 60+ blocks tells a real story on the leaderboard.

- [ ] **`git commit`** — clean commit of everything (bots, backend, frontend, new files)

---

## 🟡 YOU — verify these work before recording the demo video

- [ ] **Telegram: send `/agents`** — confirm bot responds with your 3 agents and status dots
- [ ] **Telegram: wait for rogue bot block** — confirm alert arrives on phone (fires every 3 min)
- [ ] **Telegram: send `/block rogue-bot`** — confirm it quarantines, then `/unblock rogue-bot`
- [ ] **Browser: open `/dashboard`** — click "View demo", verify 3 agent cards load with real stats
- [ ] **Browser: click rogue-bot → Activity tab** — verify blocked entries show in red with HCS seq# links
- [ ] **Browser: Earnings tab** — verify HCS paystub seq numbers appear (should show seq #674+)
- [ ] **Browser: Recovery tab** — verify Mirror Node data loads (blocked actions, summary text)
- [ ] **Browser: Policies tab** — add a test domain block, verify it shows in list
- [ ] **Browser: `/leaderboard`** — verify rep scores load from chain (500 for each bot)

---

## 🟡 YOU — OpenClaw integration (needed for OpenClaw bounty)

- [ ] **Add skill to ClawHub** — post `https://veridex.sbs/skill.md` to OpenClaw registry. This is a submission requirement for the OpenClaw bounty track.
- [ ] **Test with a real OpenClaw agent** — install the skill in your own OpenClaw instance, run one action, verify it appears in `/dashboard`. Screenshot this for the pitch deck.
- [ ] **Add "How to connect your agent" section to homepage** — two lines of config + link to skill.md. Judges need to see this is self-serve, not manual setup.

---

## 🟡 YOU — Deployment

- [ ] **Keep bots running with pm2**:
  ```bash
  npm install -g pm2
  pm2 start orchestrator/index.js --name veridex
  pm2 start bots/research-bot.js --name research-bot
  pm2 start bots/trading-bot.js --name trading-bot
  pm2 start bots/rogue-bot.js --name rogue-bot
  pm2 save && pm2 startup
  ```
- [ ] **Deploy frontend** — run `cd app && npx vercel --prod`, set `ORCHESTRATOR_URL` in Vercel dashboard to your server's public URL
- [ ] **Verify `veridex.sbs` loads** and live feed shows real bot activity

---

## 🟡 YOU — Submission content

- [ ] **Pitch deck PDF** — 12 slides (Canva, ~2hrs):
  1. Title + tagline
  2. Problem — `.env` secrets in plaintext, agents run unchecked
  3. Solution — 7-layer control plane
  4. How it works — skill.md → /api/log → block/allow → HCS
  5. Screenshots — dashboard + blocked action in red + HashScan proof
  6. Why Hedera — tamper-proof, Mirror Node readable by anyone, permanent
  7. Verifiable memory — agent restarts, reads HCS, knows what not to try again
  8. Business model
  9. GTM
  10. Roadmap
  11. Team
  12. Close — "Every action, forever on Hedera"

- [ ] **Demo video** — 5 min max, record after deployment, upload YouTube:
  1. `veridex.sbs` homepage — live stats ticking, feed showing real bot activity
  2. Connect MetaMask wallet → Dashboard
  3. Click ResearchBot → Activity tab → click an HCS seq# → HashScan opens
  4. **RogueBot fires — blocked entry in red → Telegram alert hits phone** ← this is the clip
  5. Click blocked entry HashScan link — permanently on Hedera
  6. Policies tab — add `api.sketchy.com` live
  7. Recovery tab — "this is what the agent sees when it restarts"
  8. Type `/block rogue-bot` in Telegram — agent quarantined from phone
  9. Close line: *"Every action, forever on Hedera. Tamper-proof. The agent's memory is the blockchain."*

---

## 🟡 YOU — Submit both hackathons

- [ ] **Apex** (hackathon.stackup.dev) — AI & Agents main track + OpenClaw bounty ($8k)
- [ ] **Synthesis** — Protocol Labs ERC-8004 track + Open Track
- Each needs: GitHub repo (public) · live demo URL · YouTube video · pitch deck PDF · 100-word description · tech stack

---

## Submission checklist

- [ ] GitHub repo public, commits show real history
- [ ] Live demo: veridex.sbs
- [ ] Demo video: YouTube URL
- [ ] Pitch deck: PDF
- [ ] 100-word description — see README
- [ ] Tech stack: Hedera HCS · HTS · ERC-8004 · ERC-8183 · Node.js · Next.js · SQLite · ethers.js · Telegram Bot API
