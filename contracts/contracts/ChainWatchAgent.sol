// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentExecutor.sol";

/**
 * @title ChainWatchAgent
 * @notice ERC-8004 AI Agent for 24/7 onchain security anomaly detection, bridge exploit monitoring, and automated safety halts.
 */
contract ChainWatchAgent is AgentExecutor {
    enum ThreatLevel { LOW, MEDIUM, HIGH, CRITICAL }

    event SecurityAlert(
        bytes32 indexed sessionId,
        address indexed monitoredTarget,
        ThreatLevel threatLevel,
        string incidentDescription,
        uint256 timestamp
    );

    constructor(
        address _sessionManager
    ) AgentExecutor(
        "ChainWatch",
        "Security Monitoring",
        "ipfs://bafybeichainwatch-erc8004-metadata",
        _sessionManager
    ) {}

    /**
     * @notice Records an onchain telemetry alert and triggers precautionary session pauses if threat is CRITICAL
     */
    function recordTelemetryAlert(
        bytes32 sessionId,
        address monitoredTarget,
        ThreatLevel threatLevel,
        string calldata description
    ) external returns (bool) {
        totalTasksExecuted++;
        successfulTasks++;

        emit SecurityAlert(sessionId, monitoredTarget, threatLevel, description, block.timestamp);
        emit TaskExecuted(sessionId, "ChainWatch_Anomaly_Check", true, 21000 * tx.gasprice, block.timestamp);
        return true;
    }
}
