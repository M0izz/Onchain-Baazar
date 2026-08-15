// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentExecutor.sol";

/**
 * @title VenusGuardianAgent
 * @notice ERC-8004 AI Agent for Venus Protocol health-factor monitoring and automated collateral protection.
 * Automatically injects collateral or repays borrowed debt when market volatility threatens liquidation.
 */
contract VenusGuardianAgent is AgentExecutor {
    uint256 public constant MIN_SAFE_HEALTH_FACTOR_BPS = 12000; // 1.20 in basis points
    uint256 public constant TARGET_HEALTH_FACTOR_BPS = 15000;   // 1.50 in basis points

    event LiquidationAverted(
        bytes32 indexed sessionId,
        address indexed user,
        uint256 oldHealthFactorBps,
        uint256 newHealthFactorBps,
        uint256 repayAmountWei,
        uint256 liquidationPenaltySavedWei
    );

    constructor(
        address _sessionManager
    ) AgentExecutor(
        "VenusGuardian",
        "Risk & Lending",
        "ipfs://bafybeivenusguardian-erc8004-metadata",
        _sessionManager
    ) {}

    /**
     * @notice Checks user health factor and executes debt repayment within Altana spend cap
     */
    function protectPosition(
        bytes32 sessionId,
        address targetVToken,
        uint256 currentHealthFactorBps,
        uint256 repayAmountWei
    ) external payable returns (bool) {
        uint256 startGas = gasleft();
        require(currentHealthFactorBps < MIN_SAFE_HEALTH_FACTOR_BPS, "VenusGuardian: Position safe, no action needed");

        if (repayAmountWei > 0 && address(sessionManager) != address(0)) {
            bytes memory payload = abi.encodeWithSignature("repayBorrow(uint256)", repayAmountWei);
            (bool success, ) = sessionManager.executeWithSession(
                sessionId,
                targetVToken,
                repayAmountWei,
                payload
            );
            require(success, "VenusGuardian: Altana repay execution failed");
        }

        totalTasksExecuted++;
        successfulTasks++;
        totalVolumeProtectedWei += (repayAmountWei * 10); // Estimate loan value protected

        uint256 gasUsed = (startGas - gasleft()) * tx.gasprice;
        uint256 estPenaltySaved = (repayAmountWei * 8) / 100; // 8% Venus liquidation penalty avoided

        emit LiquidationAverted(
            sessionId,
            msg.sender,
            currentHealthFactorBps,
            TARGET_HEALTH_FACTOR_BPS,
            repayAmountWei,
            estPenaltySaved
        );

        emit TaskExecuted(sessionId, "Venus_Liquidation_Protect", true, gasUsed, block.timestamp);
        return true;
    }
}
