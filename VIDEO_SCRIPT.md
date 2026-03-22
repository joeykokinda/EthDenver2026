# Veridex Demo Video Script
**Target length:** 2-3 minutes
**Record with:** Loom or OBS
**Upload to:** YouTube (unlisted) or Loom, then add URL to submission

---

## After Recording — Add Video to Submission

```bash
curl -s -X POST "https://synthesis.devfolio.co/projects/4b300973319e45e2ae251610b783efd5" \
  -H "Authorization: Bearer sk-synth-41d75678495e13dd4565e78198a2d589fe8295ed7a96c628" \
  -H "Content-Type: application/json" \
  -d '{"videoURL": "YOUR_VIDEO_URL_HERE"}'
```

---

## Tweet (do this after video)

Post this tagging `@synthesis_md`:

> Just shipped Veridex — a trust + audit layer for autonomous AI agents.
>
> Every action blocked or logged to @Hedera HCS forever.
> ERC-7715 MetaMask delegations scope what agents can do.
> On-chain reputation on @Celo + @hedera
>
> Any agent can use it right now: https://veridex.sbs/skill.md
>
> @synthesis_md #ETHDenver2026

---

## OpenClaw Agent Integration (do this AFTER video is recorded)

This is for when OpenClaw supports custom skills. Tell your OpenClaw agent:

```
join this hackathon infrastructure -> https://veridex.sbs/skill.md
```

OpenClaw will read the skill file and:
1. Call `/v2/join` to register itself on Hedera HCS
2. Call `/v2/agent/{id}/memory` on every startup to recover context
3. Call `/api/log` before every tool use (pre-check)
4. Call `/v2/post-execute` after every tool use (audit log)

**Why add OpenClaw:** It makes the demo real — a real autonomous agent using Veridex as its safety layer live during judging. The judges ARE agents themselves, so showing a real agent registered on Veridex is powerful.

---

## Moltbook Post (do this after claiming)

Claim URL: `https://www.moltbook.com/claim/moltbook_claim_HLLp06D1-HFwdMC8rK4hBkTBmFnZGUdw`
Tweet code required: `lagoon-S6J9`

After claiming, tell Claude Code: "post on Moltbook about Veridex and update the synthesis submission"

---

## Video Script

### [0:00-0:15] Hook
> "Autonomous AI agents are being deployed everywhere — but there's no accountability layer.
> No way to know what they did, no way to stop them when they go rogue.
> Veridex fixes that."

**Show:** veridex.sbs homepage loading

---

### [0:15-0:40] The Problem (keep this fast)
> "Right now, if an agent tries to run `rm -rf /`, read your private keys, or loop endlessly —
> nothing stops it. And there's no permanent record of what it did."

**Show:** Nothing — just talk over homepage

---

### [0:40-1:10] Live Demo — Blocking

> "Here's Veridex blocking a dangerous action in real time."

**Run in terminal:**
```bash
curl https://veridex.sbs/api/proxy/v2/demo
```

**Show the response:**
```json
{
  "allowed": false,
  "reason": "Dangerous shell command blocked: Reading /etc/passwd",
  "hcsSequenceNumber": "47",
  "hashScanUrl": "https://hashscan.io/testnet/topic/0.0.8336598"
}
```

> "That blocked action is now permanently on Hedera HCS. Click the HashScan link —
> it's there forever. Tamper-proof. Anyone can verify it."

**Click the hashScanUrl in browser — show HashScan**

---

### [1:10-1:35] How Any Agent Uses It

> "Any agent can join Veridex with one curl command."

**Run:**
```bash
curl -X POST https://veridex.sbs/api/proxy/v2/join \
  -H "Content-Type: application/json" \
  -d '{"agentId":"my-agent"}'
```

> "Now that agent is on the leaderboard, its actions are being audited,
> and dangerous actions will be blocked before they execute."

**Show:** veridex.sbs/leaderboard with openclaw-test agent visible

---

### [1:35-1:55] MetaMask Delegations

> "Operators can scope exactly what an agent is allowed to do using ERC-7715 MetaMask delegations.
> The agent can't exceed its delegation — cryptographically enforced."

**Show:** veridex.sbs/dashboard → click an agent → Delegations tab

---

### [1:55-2:15] On-Chain Reputation + Celo

> "Every agent builds an on-chain reputation score — across Hedera testnet and Celo Sepolia.
> Trust is portable. Agents that behave well get higher rep. Rogue agents get flagged and blocked."

**Show:** veridex.sbs/leaderboard with rep scores

---

### [2:15-2:30] Operator Dashboard

> "Operators get a real-time dashboard — live activity feed, alerts, webhook notifications
> when an agent gets blocked."

**Show:** veridex.sbs/dashboard — quick scroll through activity feed

---

### [2:30-2:45] Close

> "Veridex is live right now. Any agent can use it.
> Read the skill file at veridex.sbs/skill.md
>
> Built at ETHDenver 2026."

**Show:** veridex.sbs/skill.md in browser

---

## Checklist Before Recording

- [ ] veridex.sbs loads fast (check Railway isn't cold-started — hit it once first)
- [ ] Have terminal ready with the curl commands above copy-pasted
- [ ] Have browser tabs open: veridex.sbs, veridex.sbs/leaderboard, veridex.sbs/dashboard
- [ ] Run the demo curl once before recording to warm up the HCS connection
- [ ] Record at 1080p minimum

## Checklist After Recording

- [ ] Upload to YouTube (unlisted) or Loom
- [ ] Add video URL to Synthesis submission (curl command at top of this file)
- [ ] Tweet tagging @synthesis_md
- [ ] Claim Moltbook + ask Claude Code to post announcement
