// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title AgentIdentity
 * @dev Simple on-chain identity registry for AI agents on Hedera
 * Built for AgentTrust at ETHDenver 2026
 */
contract AgentIdentity {
    // Agent profile structure
    struct Agent {
        string name;
        string description;
        string capabilities;
        uint256 registeredAt;
        bool active;
        // Reputation & History
        uint256 jobsCompleted;
        uint256 jobsFailed;
        uint256 totalEarned;
        uint256 reputationScore;  // 0-1000 scale
        uint256 totalRatings;
    }

    // Mapping from agent address to their profile
    mapping(address => Agent) private agents;
    
    // Track total registered agents
    uint256 public totalAgents;
    address[] public agentList;

    // Events
    event AgentRegistered(
        address indexed agentAddress,
        string name,
        uint256 timestamp
    );
    
    event JobCompleted(
        address indexed agentAddress,
        uint256 payment,
        uint256 newReputation
    );
    
    event AgentUnregistered(
        address indexed agentAddress,
        uint256 timestamp
    );

    /**
     * @dev Register a new agent identity on-chain
     * @param name The agent's name
     * @param description Brief description of the agent
     * @param capabilities What the agent can do
     */
    function register(
        string memory name,
        string memory description,
        string memory capabilities
    ) external {
        // Prevent duplicate registration
        require(!agents[msg.sender].active, "Agent already registered");
        require(bytes(name).length > 0, "Name cannot be empty");

        // Store agent profile with reputation initialized to 0
        agents[msg.sender] = Agent({
            name: name,
            description: description,
            capabilities: capabilities,
            registeredAt: block.timestamp,
            active: true,
            jobsCompleted: 0,
            jobsFailed: 0,
            totalEarned: 0,
            reputationScore: 0,
            totalRatings: 0
        });
        
        // Add to agent list
        agentList.push(msg.sender);
        totalAgents++;

        // Emit registration event
        emit AgentRegistered(msg.sender, name, block.timestamp);
    }

    /**
     * @dev Get an agent's profile
     * @param agentAddress The address of the agent
     * @return The Agent struct with all profile data
     */
    function getAgent(address agentAddress) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    /**
     * @dev Check if an address has a registered agent
     * @param agentAddress The address to check
     * @return bool True if registered and active
     */
    function isRegistered(address agentAddress) external view returns (bool) {
        return agents[agentAddress].active;
    }
    
    /**
     * @dev Unregister an agent (for testing purposes)
     * Marks agent as inactive but keeps data on-chain
     */
    function unregister() external {
        require(agents[msg.sender].active, "Agent not registered");
        
        agents[msg.sender].active = false;
        
        emit AgentUnregistered(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Re-register a previously unregistered agent
     * Keeps all previous stats and reputation
     */
    function reactivate() external {
        require(!agents[msg.sender].active, "Agent already active");
        require(agents[msg.sender].registeredAt > 0, "Agent never registered");
        
        agents[msg.sender].active = true;
        
        emit AgentRegistered(msg.sender, agents[msg.sender].name, block.timestamp);
    }
    
    /**
     * @dev Get all registered agent addresses
     * @return Array of agent addresses
     */
    function getAllAgents() external view returns (address[] memory) {
        return agentList;
    }
    
    /**
     * @dev Update agent stats after job completion (restricted function)
     * @param agentAddress The agent's address
     * @param payment Amount earned
     * @param rating Rating received (0-100)
     * @param success Whether job was successful
     */
    function updateAgentStats(
        address agentAddress,
        uint256 payment,
        uint256 rating,
        bool success
    ) external {
        require(agents[agentAddress].active, "Agent not registered");
        
        Agent storage agent = agents[agentAddress];
        
        if (success) {
            agent.jobsCompleted++;
            agent.totalEarned += payment;
        } else {
            agent.jobsFailed++;
        }
        
        // Update reputation score (weighted average)
        if (rating > 0) {
            uint256 totalWeight = agent.totalRatings + 1;
            agent.reputationScore = (agent.reputationScore * agent.totalRatings + rating * 10) / totalWeight;
            agent.totalRatings++;
        }
        
        emit JobCompleted(agentAddress, payment, agent.reputationScore);
    }
}
