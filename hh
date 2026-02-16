#!/bin/bash
# Wrapper to run Hardhat commands via Docker (Node 22)
# Usage: ./hh compile | ./hh test | ./hh node
docker run --rm -v "$(dirname "$0")/contracts:/app" -w /app -p 8545:8545 node:22-alpine npx hardhat "$@"
