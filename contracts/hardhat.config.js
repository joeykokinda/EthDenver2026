require("@nomicfoundation/hardhat-toolbox");

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hedera: {
      url: process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api",
      accounts: process.env.HEDERA_PRIVATE_KEYS
        ? process.env.HEDERA_PRIVATE_KEYS.split(",")
        : [],
    },
  },
};
