// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AltanaSessionManager
 * @notice Core Session Manager for Onchain Bazaar ERC-8004 AI Agent Marketplace on BNB Smart Chain.
 * Allows users to delegate time-bound, spend-capped session keys to autonomous AI agents
 * with instant onchain emergency revocation.
 */
contract AltanaSessionManager {
    struct Session {
        address user;             // Delegator wallet address
        address agent;            // Deployed ERC-8004 Agent Contract address
        uint256 spendCapWei;      // Maximum spend allowance (in wei / tBNB)
        uint256 spentAmountWei;   // Cumulative amount spent to date
        uint256 createdAt;        // Timestamp session was created
        uint256 expiresAt;        // Expiration timestamp
        bool active;              // Active status (false once revoked or expired)
        bytes32 permissionsHash;  // Hash of authorized methods / whitelist contracts
        uint256 nonce;            // Nonce for execution ordering
    }

    // Mapping from sessionId (keccak256 hash) to Session struct
    mapping(bytes32 => Session) public sessions;
    
    // User active session lookup: user => sessionId[]
    mapping(address => bytes32[]) private userSessions;

    // Protocol metrics
    uint256 public totalSessionsCreated;
    uint256 public totalSessionsRevoked;
    uint256 public totalSpendAuthorizedWei;
    uint256 public totalSpendExecutedWei;

    // Events
    event SessionCreated(
        bytes32 indexed sessionId,
        address indexed user,
        address indexed agent,
        uint256 spendCapWei,
        uint256 expiresAt,
        bytes32 permissionsHash
    );

    event SessionExecuted(
        bytes32 indexed sessionId,
        address indexed agent,
        address target,
        uint256 amountSpentWei,
        uint256 remainingSpendWei,
        uint256 nonce
    );

    event SessionRevoked(
        bytes32 indexed sessionId,
        address indexed user,
        address indexed agent,
        uint256 remainingSpendWei,
        uint256 timestamp
    );

    event SessionExtended(
        bytes32 indexed sessionId,
        uint256 newExpiresAt,
        uint256 additionalCapWei
    );

    modifier onlySessionUser(bytes32 sessionId) {
        require(sessions[sessionId].user == msg.sender, "AltanaSessionManager: Not session owner");
        _;
    }

    modifier onlyAuthorizedAgent(bytes32 sessionId) {
        Session storage s = sessions[sessionId];
        require(s.active, "AltanaSessionManager: Session inactive or revoked");
        require(block.timestamp <= s.expiresAt, "AltanaSessionManager: Session expired");
        require(s.agent == msg.sender || s.user == msg.sender, "AltanaSessionManager: Unauthorized caller");
        _;
    }

    /**
     * @notice Creates a new spend-capped agent session
     * @param agent The target ERC-8004 agent address
     * @param spendCapWei Maximum BNB spend allowance in wei
     * @param durationSeconds Duration in seconds for which session is valid
     * @param permissionsHash Keccak256 hash of granular method/contract permissions
     */
    function createSession(
        address agent,
        uint256 spendCapWei,
        uint256 durationSeconds,
        bytes32 permissionsHash
    ) external payable returns (bytes32 sessionId) {
        require(agent != address(0), "AltanaSessionManager: Invalid agent address");
        require(durationSeconds >= 60, "AltanaSessionManager: Duration must be >= 1 min");
        require(spendCapWei > 0, "AltanaSessionManager: Spend cap must be > 0");

        sessionId = keccak256(
            abi.encodePacked(
                msg.sender,
                agent,
                block.timestamp,
                totalSessionsCreated,
                block.chainid
            )
        );

        uint256 expiresAt = block.timestamp + durationSeconds;

        sessions[sessionId] = Session({
            user: msg.sender,
            agent: agent,
            spendCapWei: spendCapWei,
            spentAmountWei: 0,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            active: true,
            permissionsHash: permissionsHash,
            nonce: 0
        });

        userSessions[msg.sender].push(sessionId);
        totalSessionsCreated++;
        totalSpendAuthorizedWei += spendCapWei;

        emit SessionCreated(
            sessionId,
            msg.sender,
            agent,
            spendCapWei,
            expiresAt,
            permissionsHash
        );

        return sessionId;
    }

    /**
     * @notice Executes an action on behalf of user within session constraints
     * @param sessionId Session identifier
     * @param target Target contract (e.g. PancakeSwap Router)
     * @param spendAmountWei Amount of BNB to spend/forward
     * @param data Payload data for target invocation
     */
    function executeWithSession(
        bytes32 sessionId,
        address target,
        uint256 spendAmountWei,
        bytes calldata data
    ) external payable onlyAuthorizedAgent(sessionId) returns (bool success, bytes memory returnData) {
        Session storage s = sessions[sessionId];
        
        require(s.spentAmountWei + spendAmountWei <= s.spendCapWei, "AltanaSessionManager: Spend cap exceeded");
        require(target != address(0), "AltanaSessionManager: Invalid target");

        s.spentAmountWei += spendAmountWei;
        s.nonce++;
        totalSpendExecutedWei += spendAmountWei;

        // Execute external call
        (success, returnData) = target.call{value: spendAmountWei}(data);
        require(success, "AltanaSessionManager: External execution failed");

        emit SessionExecuted(
            sessionId,
            s.agent,
            target,
            spendAmountWei,
            s.spendCapWei - s.spentAmountWei,
            s.nonce
        );

        return (success, returnData);
    }

    /**
     * @notice 1-Click Instant Emergency Revocation
     * @param sessionId Identifier of session to instantly revoke
     */
    function revokeSession(bytes32 sessionId) external onlySessionUser(sessionId) {
        Session storage s = sessions[sessionId];
        require(s.active, "AltanaSessionManager: Session already inactive");

        s.active = false;
        totalSessionsRevoked++;

        uint256 remainingSpend = s.spendCapWei > s.spentAmountWei ? s.spendCapWei - s.spentAmountWei : 0;

        emit SessionRevoked(
            sessionId,
            s.user,
            s.agent,
            remainingSpend,
            block.timestamp
        );
    }

    /**
     * @notice Extends duration and/or spend cap of an existing active session
     */
    function extendSession(
        bytes32 sessionId,
        uint256 additionalSeconds,
        uint256 additionalCapWei
    ) external onlySessionUser(sessionId) {
        Session storage s = sessions[sessionId];
        require(s.active, "AltanaSessionManager: Session inactive");

        s.expiresAt += additionalSeconds;
        s.spendCapWei += additionalCapWei;
        totalSpendAuthorizedWei += additionalCapWei;

        emit SessionExtended(sessionId, s.expiresAt, additionalCapWei);
    }

    /**
     * @notice Returns session details
     */
    function getSession(bytes32 sessionId) external view returns (Session memory) {
        return sessions[sessionId];
    }

    /**
     * @notice Returns all session IDs for a specific user
     */
    function getUserSessions(address user) external view returns (bytes32[] memory) {
        return userSessions[user];
    }

    /**
     * @notice Verifies if a session is currently valid for execution
     */
    function isSessionValid(bytes32 sessionId) external view returns (bool isValid, uint256 remainingSpendWei) {
        Session memory s = sessions[sessionId];
        if (!s.active || block.timestamp > s.expiresAt || s.spentAmountWei >= s.spendCapWei) {
            return (false, 0);
        }
        return (true, s.spendCapWei - s.spentAmountWei);
    }

    receive() external payable {}
}
