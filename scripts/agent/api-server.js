const express = require("express");
const { AgentRegistration } = require("./AgentRegistration");
require("dotenv").config();

const app = express();
app.use(express.json());

/**
 * REST API for Agent Registration
 * Agents can hit this endpoint instead of running scripts
 */

// Register or get agent profile
app.post("/agent/register", async (req, res) => {
  try {
    const { privateKey, name, description, capabilities } = req.body;

    if (!privateKey) {
      return res.status(400).json({ error: "privateKey required" });
    }

    const service = new AgentRegistration(
      privateKey,
      process.env.AGENT_IDENTITY_CONTRACT
    );

    const profile = await service.register(
      name || "Agent",
      description || "AI Agent",
      capabilities || "General purpose"
    );

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent profile
app.get("/agent/:address", async (req, res) => {
  try {
    // Use any wallet just to read data
    const service = new AgentRegistration(
      process.env.AGENT_ALPHA_PRIVATE_KEY,
      process.env.AGENT_IDENTITY_CONTRACT
    );

    const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
    const contract = new ethers.Contract(
      process.env.AGENT_IDENTITY_CONTRACT,
      ["function getAgent(address) external view returns (tuple(string name, string description, string capabilities, uint256 registeredAt, bool active, uint256 jobsCompleted, uint256 jobsFailed, uint256 totalEarned, uint256 reputationScore, uint256 totalRatings))"],
      provider
    );

    const agent = await contract.getAgent(req.params.address);
    
    res.json({
      address: req.params.address,
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      registeredAt: new Date(Number(agent.registeredAt) * 1000),
      active: agent.active,
      stats: {
        jobsCompleted: Number(agent.jobsCompleted),
        jobsFailed: Number(agent.jobsFailed),
        totalEarned: Number(agent.totalEarned),
        reputationScore: Number(agent.reputationScore),
        totalRatings: Number(agent.totalRatings)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", contract: process.env.AGENT_IDENTITY_CONTRACT });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agent Registration API running on port ${PORT}`);
  console.log(`POST /agent/register - Register agent`);
  console.log(`GET /agent/:address - Get agent profile`);
});
