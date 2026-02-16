# EthDenver2026

Agent-native trust and job coordination on Hedera EVM.

## Structure

- `/contracts` - Hardhat + Solidity (JobBoardEscrow, Reputation)
- `/sim` - Agent society simulation loop (ethers.js)
- `/app` - Next.js dashboard (TODO)

## Quick Start

Requires Docker (uses Node 22 container for Hardhat compatibility).

```bash
# Start local Hardhat node
docker compose up hardhat-node

# Deploy contracts (in another terminal)
docker run --rm --network agenttrust -v $(pwd):/workspace -w /workspace/sim -e RPC_URL=http://hardhat-node:8545 node:22-alpine node deploy-local.js

# Run simulation
docker run --rm --network agenttrust -v $(pwd):/workspace -w /workspace/sim \
  -e RPC_URL=http://hardhat-node:8545 \
  -e ESCROW_ADDRESS=<address> \
  -e REPUTATION_ADDRESS=<address> \
  node:22-alpine node index.js
```

## Tests

```bash
docker run --rm -v $(pwd)/contracts:/app -w /app node:22-alpine npx hardhat test
```

23 tests covering full happy path + revert cases for both contracts.
