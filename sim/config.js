import "dotenv/config";

export const NETWORK = process.env.NETWORK || "local";
export const RPC_URL =
  NETWORK === "hedera"
    ? process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api"
    : process.env.RPC_URL || "http://localhost:8545";

export const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS;
export const REPUTATION_ADDRESS = process.env.REPUTATION_ADDRESS;

// Hardhat default accounts (local only)
export const HARDHAT_ACCOUNTS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
];

export const MIRROR_NODE_URL =
  NETWORK === "hedera"
    ? "https://testnet.mirrornode.hedera.com"
    : null;
