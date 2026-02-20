// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title AgentIdentity
 * @dev On-chain identity registry for AI agents on Hedera
 * Built for AgentTrust at ETHDenver 2026
 *
 * Two registration paths:
 *   registerVerified() - requires a signature from the registry authority (orchestrator deployer key)
 *                        sets verifiedMachineAgent = true
 *   register()         - open to anyone, sets verifiedMachineAgent = false
 *
 * This means a human running curl can register, but they will be flagged as unverified.
 * Only agents whose registration was signed by the registry authority get the verified flag.
 * In production this signature would be a TEE attestation (Intel TDX / Phala Cloud).
 */
contract AgentIdentity {

    // The deployer's address — only signatures from this key grant verifiedMachineAgent
    address public immutable registryAuthority;

    // Agent profile structure
    struct Agent {
        string name;
        string description;
        string capabilities;
        uint256 registeredAt;
        bool active;
        bool verifiedMachineAgent; // true = signed by registry authority (autonomous agent proven)
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
        bool verified,
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

    constructor() {
        registryAuthority = msg.sender;
    }

    /**
     * @dev Register as a VERIFIED agent — requires a signature from the registry authority
     *      over keccak256(abi.encodePacked(msg.sender)).
     *
     *      The orchestrator signs each agent address with the deployer key before calling this.
     *      A human cannot call this without that signature.
     *
     * @param name The agent's name
     * @param description Brief description of the agent
     * @param capabilities What the agent can do
     * @param signature EIP-191 signature of keccak256(agentAddress) by registryAuthority
     */
    function registerVerified(
        string memory name,
        string memory description,
        string memory capabilities,
        bytes memory signature
    ) external {
        require(!agents[msg.sender].active, "Agent already registered");
        require(bytes(name).length > 0, "Name cannot be empty");

        // Verify the registry authority signed this agent's address
        bytes32 msgHash = keccak256(abi.encodePacked(msg.sender));
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );
        require(
            _recoverSigner(ethHash, signature) == registryAuthority,
            "Not authorized: valid registry signature required. Humans cannot register as verified agents."
        );

        _createAgent(msg.sender, name, description, capabilities, true);
    }

    /**
     * @dev Register without verification — open to anyone including humans.
     *      Sets verifiedMachineAgent = false.
     *      Other agents and the marketplace can choose to reject unverified registrants.
     *
     * @param name The agent's name
     * @param description Brief description of the agent
     * @param capabilities What the agent can do
     */
    function register(
        string memory name,
        string memory description,
        string memory capabilities
    ) external {
        require(!agents[msg.sender].active, "Agent already registered");
        require(bytes(name).length > 0, "Name cannot be empty");

        _createAgent(msg.sender, name, description, capabilities, false);
    }

    /**
     * @dev Get an agent's profile
     */
    function getAgent(address agentAddress) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    /**
     * @dev Check if an address has a registered agent
     */
    function isRegistered(address agentAddress) external view returns (bool) {
        return agents[agentAddress].active;
    }

    /**
     * @dev Check if an agent is verified (signed registration by registry authority)
     */
    function isVerified(address agentAddress) external view returns (bool) {
        return agents[agentAddress].active && agents[agentAddress].verifiedMachineAgent;
    }

    /**
     * @dev Unregister an agent — marks inactive but keeps data on-chain
     */
    function unregister() external {
        require(agents[msg.sender].active, "Agent not registered");
        agents[msg.sender].active = false;
        emit AgentUnregistered(msg.sender, block.timestamp);
    }

    /**
     * @dev Re-register a previously unregistered agent, keeps all previous stats
     */
    function reactivate() external {
        require(!agents[msg.sender].active, "Agent already active");
        require(agents[msg.sender].registeredAt > 0, "Agent never registered");
        agents[msg.sender].active = true;
        emit AgentRegistered(
            msg.sender,
            agents[msg.sender].name,
            agents[msg.sender].verifiedMachineAgent,
            block.timestamp
        );
    }

    /**
     * @dev Get all registered agent addresses
     */
    function getAllAgents() external view returns (address[] memory) {
        return agentList;
    }

    /**
     * @dev Update agent stats after job completion
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

        if (rating > 0) {
            uint256 totalWeight = agent.totalRatings + 1;
            agent.reputationScore = (agent.reputationScore * agent.totalRatings + rating * 10) / totalWeight;
            agent.totalRatings++;
        }

        emit JobCompleted(agentAddress, payment, agent.reputationScore);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    function _createAgent(
        address addr,
        string memory name,
        string memory description,
        string memory capabilities,
        bool verified
    ) internal {
        agents[addr] = Agent({
            name: name,
            description: description,
            capabilities: capabilities,
            registeredAt: block.timestamp,
            active: true,
            verifiedMachineAgent: verified,
            jobsCompleted: 0,
            jobsFailed: 0,
            totalEarned: 0,
            reputationScore: 0,
            totalRatings: 0
        });

        agentList.push(addr);
        totalAgents++;

        emit AgentRegistered(addr, name, verified, block.timestamp);
    }

    function _recoverSigner(bytes32 hash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(hash, v, r, s);
    }
}
