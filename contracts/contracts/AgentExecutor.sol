// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AltanaSessionManager.sol";

/**
 * @title AgentExecutor
 * @notice Abstract base contract for ERC-8004 AI agents operating on Onchain Bazaar.
 * Standardizes metadata, reputation metrics, and Altana session integration.
 */
abstract contract AgentExecutor {
    string public agentName;
    string public agentCategory; // "DEX Automation", "Risk & Lending", "Yield Optimizer", "Security Monitoring"
    string public agentURI;      // IPFS or HTTP metadata link
    address public owner;
    AltanaSessionManager public sessionManager;

    // Performance & Telemetry metrics recorded onchain
    uint256 public totalTasksExecuted;
    uint256 public successfulTasks;
    uint256 public failedTasks;
    uint256 public totalVolumeProtectedWei;
    uint256 public gasEfficiencyScore; // 1-100 score

    event TaskExecuted(
        bytes32 indexed sessionId,
        string taskType,
        bool success,
        uint256 gasUsed,
        uint256 timestamp
    );

    event ReputationUpdated(
        uint256 newScore,
        uint256 totalTasks
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentExecutor: Only owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _category,
        string memory _uri,
        address _sessionManager
    ) {
        agentName = _name;
        agentCategory = _category;
        agentURI = _uri;
        owner = msg.sender;
        sessionManager = AltanaSessionManager(payable(_sessionManager));
        gasEfficiencyScore = 98;
    }

    function setSessionManager(address _sessionManager) external onlyOwner {
        sessionManager = AltanaSessionManager(payable(_sessionManager));
    }

    function getSuccessRate() external view returns (uint256) {
        if (totalTasksExecuted == 0) return 100;
        return (successfulTasks * 100) / totalTasksExecuted;
    }

    function getAgentDetails() external view returns (
        string memory name,
        string memory category,
        string memory uri,
        uint256 totalTasks,
        uint256 successRate,
        uint256 volumeProtected,
        uint256 gasScore
    ) {
        uint256 rate = totalTasksExecuted == 0 ? 100 : (successfulTasks * 100) / totalTasksExecuted;
        return (
            agentName,
            agentCategory,
            agentURI,
            totalTasksExecuted,
            rate,
            totalVolumeProtectedWei,
            gasEfficiencyScore
        );
    }
}
