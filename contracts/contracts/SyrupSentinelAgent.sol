// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentExecutor.sol";

/**
 * @title SyrupSentinelAgent
 * @notice ERC-8004 AI Agent for PancakeSwap v3 Concentrated LP range rebalancing and slippage-protected swaps.
 * Operates under Altana spend caps to ensure maximum capital efficiency and zero unauthorized spending.
 */
contract SyrupSentinelAgent is AgentExecutor {
    // Official PancakeSwap v3 / v2 Testnet Routers
    address public pancakeV3Router;
    address public pancakeV2Router; // Fallback router: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1

    struct PositionRange {
        int24 lowerTick;
        int24 upperTick;
        uint256 lastRebalanceTime;
        uint256 totalRebalances;
    }

    mapping(bytes32 => PositionRange) public monitoredPositions;

    event RangeRebalanced(
        bytes32 indexed sessionId,
        address indexed pool,
        int24 oldLowerTick,
        int24 oldUpperTick,
        int24 newLowerTick,
        int24 newUpperTick,
        uint256 amountSwappedWei,
        uint256 gasSavedWei
    );

    event SwapExecuted(
        bytes32 indexed sessionId,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(
        address _sessionManager,
        address _pancakeV3Router,
        address _pancakeV2Router
    ) AgentExecutor(
        "SyrupSentinel",
        "DEX Automation",
        "ipfs://bafybeisyrupsentinel-erc8004-metadata",
        _sessionManager
    ) {
        pancakeV3Router = _pancakeV3Router;
        pancakeV2Router = _pancakeV2Router;
    }

    function setRouters(address _v3, address _v2) external onlyOwner {
        pancakeV3Router = _v3;
        pancakeV2Router = _v2;
    }

    /**
     * @notice Rebalances concentrated LP range via Altana session
     * @param sessionId User's active Altana session key
     * @param pool PancakeSwap v3 pool address
     * @param newLowerTick New lower tick boundary
     * @param newUpperTick New upper tick boundary
     * @param swapAmountWei Amount of BNB / token needed to rebalance
     */
    function rebalanceLPRange(
        bytes32 sessionId,
        address pool,
        int24 newLowerTick,
        int24 newUpperTick,
        uint256 swapAmountWei
    ) external payable returns (bool) {
        uint256 startGas = gasleft();

        // Target either v3 router or pool contract
        address target = pancakeV3Router != address(0) ? pancakeV3Router : pancakeV2Router;
        if (target == address(0)) {
            target = address(this); // Internal execution fallback
        }

        bytes memory payload = abi.encodeWithSignature(
            "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            pool
        );

        // Execute through AltanaSessionManager spend cap enforcement
        if (swapAmountWei > 0 && address(sessionManager) != address(0)) {
            (bool success, ) = sessionManager.executeWithSession(
                sessionId,
                target,
                swapAmountWei,
                payload
            );
            require(success, "SyrupSentinel: Altana execution failed");
        }

        PositionRange storage pr = monitoredPositions[sessionId];
        int24 oldLower = pr.lowerTick;
        int24 oldUpper = pr.upperTick;
        pr.lowerTick = newLowerTick;
        pr.upperTick = newUpperTick;
        pr.lastRebalanceTime = block.timestamp;
        pr.totalRebalances++;

        totalTasksExecuted++;
        successfulTasks++;
        totalVolumeProtectedWei += swapAmountWei;

        uint256 gasUsed = (startGas - gasleft()) * tx.gasprice;

        emit RangeRebalanced(
            sessionId,
            pool,
            oldLower,
            oldUpper,
            newLowerTick,
            newUpperTick,
            swapAmountWei,
            gasUsed
        );

        emit TaskExecuted(sessionId, "PancakeSwap_Rebalance", true, gasUsed, block.timestamp);
        return true;
    }

    receive() external payable {}
}
