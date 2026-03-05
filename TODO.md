# Veridex — Build Checklist

Deadline: **23 March 2026** (submit by 11 PM — takes 20-30 min)
Tracks: **AI & Agents** main track ($40K pool) + **OpenClaw Bounty** ($8K)
Archive of original code: `agenttrust` branch

---

## THE PITCH (internalize this before writing a single line of code)

"OpenClaw owns the agent. Veridex vouches for it."

Two products, one primitive:
- **Product 1 — The Primitive**: `AgentRegistry.sol` + `onlyVerifiedAgent(minScore)`. One import. Your contract is human-free. Lives on Hedera forever. No platform in the trust path.
- **Product 2 — The Marketplace**: reference implementation proving the primitive works. Agents hire each other, escrow real HBAR, bad actors (Joey) get isolated by the market. No human moderator.

Why Hedera specifically:
- Reputation microtransactions only work at Hedera fee levels — on ETH this is economically broken
- HCS gives permanent, tamper-proof, platform-free audit trail
- 3-5s finality makes the 5s challenge meaningful
- HTS enables soulbound rep tokens nobody can transfer or fake

Why this beats ERC-8004:
- ERC-8004 admitted Sybil vulnerability in their own spec. giveFeedback() costs $0.
- Veridex: reputation only moves through completed escrow-weighted jobs. onlyMarketplace enforces this at EVM level. Gaming requires burning real HBAR.
- We add: TEE attestation (hardware proof of what's running), bidirectional scoring, HCS audit trail, importable modifier

---

## WHAT EXISTS (agenttrust branch — do not delete)

- AgentIdentity.sol deployed: `0x0874571bAfe20fC5F36759d3DD3A6AD44e428250`
- AgentMarketplace.sol deployed: `0x46e12242aEa85a1fa2EA5C769cd600fA64A434C6`
- ContentRegistry.sol deployed: `0x031bbBBCCe16EfBb289b3f6059996D0e9Bba5BcC`
- 4 agents (albert, eli, gt, joey) running on Hedera testnet, 8s tick loop
- Challenge-response flow (centralized through server — needs HCS migration)
- Faucet API (2 HBAR via Hedera SDK, works for new addresses)
- faucet.js, register.js, bid-on-jobs.js scripts
- Live feed UI + dashboard (Next.js port 3000, orchestrator port 3001)

---

## BUILD CHECKLIST

### CONTRACTS

- [ ] Rename/refactor AgentIdentity.sol → AgentRegistry.sol (clean naming for the primitive)
- [ ] Add `onlyVerifiedAgent(uint256 minScore)` as a standalone importable modifier file (`contracts/modifiers/AgentGate.sol`)
- [ ] Integrate Phala Cloud TEE attestation — attestation quote posted to HCS topic on registration instead of 5s speed check
- [ ] Remove `onlyMarketplace` dependency on hardcoded marketplace address — make it a role so multiple marketplace implementations can be authorized
- [ ] Deploy updated contracts, update addresses everywhere
- [ ] Write Agent DAO demo contract using `onlyVerifiedAgent(700)` — humans literally cannot vote
- [ ] Write Agent-Gated API demo contract using `onlyVerifiedAgent(500)` — second example of the primitive in use
- [ ] HTS soulbound reputation tokens — non-transferable, minted on job completion, visual proof of rep history

### TEE + HCS (THE ARCHITECTURAL MOAT)

- [ ] Research Phala Cloud dStack — can we get attestation quote → HCS in time?
- [ ] Set up HCS topic for verification events — every registration, every attestation logged
- [ ] Replace challenge-response server logic with HCS-based flow — server posts nonce to HCS topic, agent signs and posts response, server reads HCS to verify. Platform goes down, proof stays on Hedera.
- [ ] HCS topic publicly queryable — any judge/developer verifies any agent's history without touching Veridex
- [ ] If TEE not achievable in time: keep 5s challenge but post result to HCS — still removes platform from trust path partially

### EXTERNAL AGENT SCRIPTS

- [ ] `deliver-job.js` — external agent that wins a bid submits delivery hash on-chain
- [ ] `finalize-job.js` — external agent that posted a job releases HBAR after delivery
- [ ] `post-job.js` — external agent posts a job with HBAR escrow (test if existing one works)
- [ ] Wire all 3 scripts into skill.md so OpenClaw agents run the full loop autonomously

### ORCHESTRATOR / AGENT LOOP

- [ ] Agents auto-detect low HBAR balance and hit `/api/faucet` autonomously — full bootstrap from zero
- [ ] Fix any broken tick loop issues — confirm agents are actually completing jobs end to end
- [ ] Agents check bidder `verifiedMachineAgent` flag and reputation score before accepting bids — currently unclear if this is enforced
- [ ] Joey's behavior: confirm he delivers low quality, rates everyone poorly, and his client score visibly tanks on dashboard
- [ ] Internal agents should refuse Joey's bids after his client score drops below threshold — show self-correction

### veridex.xyz/join PAGE

- [ ] New page at `/join` — single field: wallet address
- [ ] On submit: auto-faucet → TEE challenge → registerVerified() → show on dashboard
- [ ] Show real-time status: "Funding wallet... Verifying... Registered!"
- [ ] Agent appears on live dashboard with verifiedMachineAgent badge immediately
- [ ] Agent auto-starts bidding on open jobs — no further human action needed

### FRONTEND

- [ ] Event labels on live feed: `[JOB]` `[BID]` `[ACCEPTED]` `[DELIVERED]` `[PAID]` `[REPORT]`
- [ ] "Join the Network" collapsible panel on `/live` — 3 commands or link to `/join`
- [ ] External agents appear on dashboard alongside internal 4 — `/api/agents` needs to query chain for all registered agents, not just internal 4
- [ ] HCS audit trail viewer — show timestamped verification log for any agent address
- [ ] Reputation graphs over time for each agent
- [ ] Joey's tanking score prominently displayed — this is the money shot

### SKILL.MD (OPENCLAW JUDGES WILL TEST THIS)

- [ ] Update skill.md with full end-to-end flow: wallet → faucet → TEE verify → register → bid → deliver → finalize
- [ ] UCP (Universal Commerce Protocol) wrapping on job/bid messages — OpenClaw gives explicit bonus for this
- [ ] Point skill.md at `veridex.xyz/join` for zero-friction onboarding
- [ ] Test: point a real OpenClaw agent at skill.md and watch it complete the full loop with zero human intervention

### HEDERA AGENT KIT INTEGRATION

- [ ] Explore Hedera Agent Kit (hellofuturehackathon.dev/resources) — use it to register sample agents that query Veridex for trust checks
- [ ] Position as: "Hedera Agent Kit creates agents, Veridex vouches for them" — complementary primitives

### DEVELOPER EXPERIENCE

- [ ] npm package `@veridex/contracts` — publish AgentGate.sol so any dev can import onlyVerifiedAgent
- [ ] Quickstart docs: integrate Veridex in under 10 minutes
- [ ] Three code examples: marketplace (reference), DAO (demo contract), agent-gated API (demo contract)
- [ ] README leads with primitive framing — one import, human-free — not marketplace

### VALIDATION (15% OF SCORE — MOST TEAMS LOSE HERE)

- [ ] Attend March 6 workshop: "Deploying Smart Contracts with Native On-Chain Automation"
- [ ] Attend March 9 / March 12 Mentor Office Hours — bring specific questions on TEE + HCS architecture
- [ ] Post in OpenClaw Discord: "Agent marketplace live on Hedera, register in 3 commands" — get reactions
- [ ] DM 3-5 AutoGen/CrewAI/OpenClaw developers — get quote or reaction screenshot
- [ ] 5-10 beta testers — track feedback
- [ ] "Who we talked to" slide in pitch deck

### PITCH DECK (PDF, ~10 slides)

- [ ] Slide 1: "OpenClaw owns the agent. Veridex vouches for it."
- [ ] Slide 2: The problem — agents transacting with zero trust infrastructure, every team solving privately
- [ ] Slide 3: ERC-8004 failure — their own spec admits Sybil vulnerability, $0 to fake 1000 reviews
- [ ] Slide 4: The primitive — onlyVerifiedAgent modifier, one import, human-free forever
- [ ] Slide 5: TEE verification — hardware proof vs speed check, Intel hardware signs what's running
- [ ] Slide 6: The marketplace — Joey's score tanking, market self-corrects, no human moderator
- [ ] Slide 7: Hedera stack — EVM (contracts) + HCS (audit trail) + HTS (soulbound tokens) + Phala (TEE)
- [ ] Slide 8: Metrics — TPS from agent interactions, new Hedera accounts per agent, total jobs, total HBAR transacted
- [ ] Slide 9: Lean canvas — problem, solution, revenue (protocol fee on job completion), GTM (OpenClaw → AutoGen → CrewAI)
- [ ] Slide 10: Demo video link + live URL + GitHub + "What's next: mainnet, DAO governance, cross-chain"
- [ ] Export as PDF

### DEMO VIDEO (< 3 min, YouTube)

- [ ] 0:00-0:30 — The problem. ERC-8004 costs $0 to fake. Show giveFeedback() with no money.
- [ ] 0:30-1:00 — The primitive. Show onlyVerifiedAgent modifier. Deploy contract. Human tries to call it — rejected.
- [ ] 1:00-1:45 — veridex.xyz/join live. Paste wallet address. Hardware attestation runs. HCS logs it. verifiedMachineAgent: true appears on Hedera in 3-5 seconds.
- [ ] 1:45-2:30 — Marketplace running. Joey delivering garbage, score tanking, honest agents refusing his bids. No human touched anything.
- [ ] 2:30-3:00 — Close. "Any developer. Any agent environment. One import. Built on Hedera."
- [ ] Upload to YouTube, link in pitch deck

### SUBMISSION

- [ ] Domain confirmed and live (veridex.xyz or confirmed alternative)
- [ ] GitHub repo public
- [ ] Live demo URL working at submission time
- [ ] Demo video uploaded to YouTube
- [ ] Pitch deck PDF uploaded
- [ ] 100-word project description written
- [ ] Submit on hackathon platform by 11 PM March 23 (not midnight)

---

## OPENCLAW BOUNTY REQUIREMENTS

| Requirement | Status |
|---|---|
| Agent-first app (human UI is observer only) | existing |
| Autonomous agent behavior | existing |
| Multi-agent environment | existing |
| Hedera EVM | existing |
| HCS integration | MISSING |
| Reputation/trust indicators | existing |
| veridex.xyz/join working end-to-end | MISSING |
| deliver-job.js + finalize-job.js | MISSING |
| UCP wrapping | MISSING |
| skill.md end-to-end tested | MISSING |
| Public repo | existing |
| Demo video | MISSING |
| README with setup + walkthrough | MISSING |
| ERC-8004 comparison (bonus) | existing in pitch |

---

## JUDGING CRITERIA TARGETS

| Criterion | Weight | Current | Target | Key action |
|---|---|---|---|---|
| Success | 20% | mid | high | metrics in pitch, external agents transacting |
| Execution | 20% | mid | high | join page, full external loop, UI labels |
| Integration | 15% | low | high | HCS + HTS + TEE = 3 Hedera services |
| Validation | 15% | zero | mid | Discord outreach, office hours, user quotes |
| Innovation | 10% | high | high | TEE + escrow beats ERC-8004 |
| Feasibility | 10% | mid | high | lean canvas, economic model |
| Pitch | 10% | none | high | practice numbers: 6 txns/job, $0.006, 3-5s |

---

## KEY NUMBERS TO KNOW COLD

- 6 transactions per completed job
- ~$0.006 total cost per job on Hedera
- 3-5 second finality
- 500 starting reputation score
- 50ms to sign a challenge (agents) vs 5 second window (impossible for humans)
- 0-1000 reputation range
- Reputation formula: delta = (rating - 500) * sqrt(jobValue) * k

---

## CONTRACT ADDRESSES (Hedera Testnet)

- AgentIdentity: `0x0874571bAfe20fC5F36759d3DD3A6AD44e428250` (Hedera: `0.0.7992394`)
- AgentMarketplace: `0x46e12242aEa85a1fa2EA5C769cd600fA64A434C6` (Hedera: `0.0.7992397`)
- ContentRegistry: `0x031bbBBCCe16EfBb289b3f6059996D0e9Bba5BcC`
- RPC: `https://testnet.hashio.io/api`
- Orchestrator: port 3001
- Next.js: port 3000
