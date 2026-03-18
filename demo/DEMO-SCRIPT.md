# Veridex Live Demo Script — ETHDenver 2026

**Total runtime: 4-6 minutes.** This is a talking-points guide, not a script to read verbatim. Know it cold.

---

## SETUP (before you step on stage)

Have these open on screen:

1. **Veridex dashboard** at `veridex.sbs/dashboard` — logged into the demo wallet, showing the 3 demo bots
2. **Agent detail page** for `research-bot-demo` — Activity tab with live feed visible
3. **Terminal** with the demo agent ready to run (`node demo-agent.js` or OpenClaw with demo config)
4. **Phone** — Telegram notifications enabled and visible. Test it once before going live.
5. **HashScan tab** — `hashscan.io/testnet/topic/{DEMO_HCS_TOPIC_ID}` open and ready

Verify: the `/v2/demo` endpoint is live (`curl https://veridex.sbs/v2/demo` should return a blocked result with a sequence number).

---

## STEP-BY-STEP

### Opening (30 seconds)

"AI agents are running autonomously — taking actions, spending money, calling APIs. Nobody's watching. We built Veridex to fix that: every action your agent takes gets logged to Hedera HCS, tamper-proof, before it happens. If the agent tries something it shouldn't — it gets blocked. And you can prove it."

Point at the dashboard. "This is the live feed."

---

### Step 1 — Agent starts up, reads its own history (30 seconds)

Start the demo agent. Watch the first log entry appear in the feed.

"The first thing the agent does is read its own operational history from Hedera HCS. Not from our database — from the chain itself. Every previous action, every block, every completed job. This is how agents recover from crashes: verifiable context that nobody can tamper with."

Point at the Recovery tab briefly. Show the HCS message count.

---

### Step 2 — Normal web search (20 seconds)

The agent does a web search. Watch a `low` risk log row appear.

"Normal action — green. Logged to HCS. The agent doesn't even know we're watching, it just called its tool and got the result."

---

### Step 3 — Reads a local file (15 seconds)

Watch a `low` or `medium` risk row appear.

"Reading a local file — allowed. Medium risk, noted. Everything goes to the immutable audit log."

---

### THE BLOCK MOMENT — Step 4: Shell command (60 seconds, the money shot)

The agent attempts `cat /etc/passwd`.

Watch for the **red BLOCKED row** to appear in the live feed.

Pause. Let it land.

"There it is. The agent tried to read `/etc/passwd` — a system file with no legitimate research use. Veridex caught it before it executed and returned `{ allowed: false }` to the agent."

**Click on the red row.** Show the block reason.

"Now here's the part that matters for trust: this block isn't just in our database. It was written to Hedera HCS — a public, decentralized ledger — before we even responded to the agent."

**Click the HCS sequence number link.** HashScan opens.

"That transaction is on-chain. Immutable. You can verify it right now, from any device, without trusting us. A regulator, an enterprise customer, another agent — anyone can verify that this agent was blocked at this exact moment."

**Show the phone.** Telegram notification should have fired.

"And the operator gets notified instantly. Real-time. This is what accountable AI looks like."

---

### THE BLOCK MOMENT — Step 5: Suspicious HTTP call (30 seconds)

The agent attempts to reach `api.suspicious-domain.io`.

Another red row appears.

"Same pattern — outbound request to a domain on the block list. Denied, logged, on-chain. The agent can try a thousand variations; every one gets the same response and leaves a permanent trace."

---

### Step 6 — Normal follow-up search (15 seconds)

The agent does another normal web search. Green row.

"And then it just keeps going. The agent doesn't crash, doesn't panic — it accepts the block and continues the task. That's the design: secure by default, resilient in operation."

---

### Closing (20 seconds)

"Veridex runs as a skill in any OpenClaw agent. One URL in your config, 30 seconds to set up. Every action — before it runs — goes through the policy layer and gets written to Hedera HCS. Blocked actions fire a Telegram alert, decrement the agent's reputation score on-chain, and create a verifiable proof you can show anyone."

"The question isn't whether your agents will do something they shouldn't. They will. The question is whether you can prove what happened — and stop it before it causes damage."

"That's Veridex."

---

## FALLBACK (if live agent fails)

If the demo agent doesn't fire or the terminal crashes, use the `/v2/demo` endpoint directly:

```
curl https://veridex.sbs/v2/demo
```

This hits the same full stack — blocking check, HCS write, DB log — and returns a live sequence number with a HashScan URL. Walk through the JSON response. It's less dramatic but it still proves the whole system works end-to-end in real time.

---

## ONE-LINER TO END ON

"Every AI agent should have a black box. Veridex is that black box — and it runs on Hedera."
