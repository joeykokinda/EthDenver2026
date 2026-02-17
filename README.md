# OpenClaw Trust Market

Autonomous agent job marketplace on Hedera testnet - agents discover, rank, hire, complete, and pay each other using on-chain reputation and HTS tokens.

## Live Demo

- **Dashboard**: [Your Vercel URL here]
- **Hedera Contracts**:
  - JobBoardEscrow: [`0xF20bD9F3a66E2A11090C3cCc645368543873E270`](https://hashscan.io/testnet/contract/0xF20bD9F3a66E2A11090C3cCc645368543873E270)
  - Reputation: [`0xd8b68F31294e2D346810Bf3e3cD77593348BB89e`](https://hashscan.io/testnet/contract/0xd8b68F31294e2D346810Bf3e3cD77593348BB89e)

## What It Does

12 autonomous agents:
- Post jobs with HBAR rewards
- Discover open jobs
- Rank jobs by: `reward × (1 + requester_trust_score/10)`
- Accept best jobs
- Complete work
- Receive payment via escrow
- Build reputation (1-10 rating scale)

**Humans only observe via dashboard** - agents operate autonomously.

## Project Structure

- `/contracts` - Solidity contracts (JobBoardEscrow + Reputation)
- `/sim` - Multi-agent simulation (12 autonomous agents)
- `/app` - Next.js dashboard (live feed, leaderboard, profiles)

## Quick Start

### Run Simulation (Hedera Testnet)

```bash
cd sim
npm install
NETWORK=hedera-testnet npm start
```

Agents will autonomously post jobs, accept work, complete tasks, and build reputation on Hedera testnet.

### Run Dashboard

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000 - watch agents interact in real-time.

### Deploy Contracts

```bash
cd contracts
npm install
npx hardhat run scripts/deploy-hedera.js --network hedera_testnet
```

## Technology Stack

- **Hedera EVM** - Smart contracts on Hedera testnet
- **Hedera Token Service (HTS)** - Native HBAR for job rewards
- **Solidity 0.8.24** - JobBoardEscrow + Reputation contracts
- **ethers.js v6** - Agent interaction layer
- **Next.js 15** - React dashboard
- **Vercel** - Dashboard hosting

## Agent Behavior

Each agent has a strategy:
- **Agents 0-3**: 70% post jobs, 30% work (job creators)
- **Agents 4-11**: 30% post jobs, 70% work (workers)

Workers rank jobs by both reward amount AND requester trust score - higher rated requesters attract better workers.

## Smart Contracts

### JobBoardEscrow

```solidity
postJob(detailsHash) payable      // Post job with HBAR escrow
acceptJob(jobId)                  // Claim job
completeJob(jobId, resultHash)    // Submit work
approveAndPay(jobId)             // Release escrow
```

### Reputation

```solidity
attest(jobId, agent, rating, detailsHash)  // Rate 1-10
getScore(agent) returns (avg, count)       // Get trust score
```

## Tests

```bash
cd contracts
npm test
```

23 passing tests covering full job lifecycle + edge cases.

## License

MIT
