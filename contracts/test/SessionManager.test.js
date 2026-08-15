const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AltanaSessionManager & ERC-8004 Agents", function () {
  let sessionManager;
  let syrupSentinel;
  let owner, user, agentWallet, stranger;

  beforeEach(async function () {
    [owner, user, agentWallet, stranger] = await ethers.getSigners();

    const AltanaSessionManager = await ethers.getContractFactory("AltanaSessionManager");
    sessionManager = await AltanaSessionManager.deploy();
    await sessionManager.waitForDeployment();

    const SyrupSentinelAgent = await ethers.getContractFactory("SyrupSentinelAgent");
    syrupSentinel = await SyrupSentinelAgent.deploy(
      await sessionManager.getAddress(),
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );
    await syrupSentinel.waitForDeployment();
  });

  describe("Altana Session Lifecycle", function () {
    it("Should create a spend-capped session successfully", async function () {
      const spendCap = ethers.parseEther("0.1"); // 0.1 tBNB
      const duration = 3600; // 1 hour
      const permHash = ethers.keccak256(ethers.toUtf8Bytes("ALL_PERMISSIONS"));

      const agentAddr = await syrupSentinel.getAddress();
      const tx = await sessionManager.connect(user).createSession(
        agentAddr,
        spendCap,
        duration,
        permHash
      );
      const receipt = await tx.wait();

      const userSessions = await sessionManager.getUserSessions(user.address);
      expect(userSessions.length).to.equal(1);

      const session = await sessionManager.getSession(userSessions[0]);
      expect(session.user).to.equal(user.address);
      expect(session.agent).to.equal(agentAddr);
      expect(session.spendCapWei).to.equal(spendCap);
      expect(session.spentAmountWei).to.equal(0);
      expect(session.active).to.be.true;
    });

    it("Should allow 1-click instant session revocation", async function () {
      const spendCap = ethers.parseEther("0.05");
      const duration = 7200;
      const permHash = ethers.ZeroHash;

      const agentAddr = await syrupSentinel.getAddress();
      await sessionManager.connect(user).createSession(
        agentAddr,
        spendCap,
        duration,
        permHash
      );

      const userSessions = await sessionManager.getUserSessions(user.address);
      const sessionId = userSessions[0];

      // Revoke session
      await sessionManager.connect(user).revokeSession(sessionId);

      const session = await sessionManager.getSession(sessionId);
      expect(session.active).to.be.false;

      const [isValid] = await sessionManager.isSessionValid(sessionId);
      expect(isValid).to.be.false;
    });

    it("Should reject revocation from non-owner", async function () {
      const spendCap = ethers.parseEther("0.05");
      const duration = 7200;
      const permHash = ethers.ZeroHash;

      const agentAddr = await syrupSentinel.getAddress();
      await sessionManager.connect(user).createSession(
        agentAddr,
        spendCap,
        duration,
        permHash
      );

      const userSessions = await sessionManager.getUserSessions(user.address);
      const sessionId = userSessions[0];

      await expect(
        sessionManager.connect(stranger).revokeSession(sessionId)
      ).to.be.revertedWith("AltanaSessionManager: Not session owner");
    });
  });

  describe("SyrupSentinel Agent Execution", function () {
    it("Should rebalance LP range and record metrics", async function () {
      const spendCap = ethers.parseEther("0.05");
      const duration = 3600;
      const permHash = ethers.ZeroHash;
      const agentAddr = await syrupSentinel.getAddress();

      await sessionManager.connect(user).createSession(
        agentAddr,
        spendCap,
        duration,
        permHash
      );
      const [sessionId] = await sessionManager.getUserSessions(user.address);

      const mockPool = stranger.address;
      const tx = await syrupSentinel.connect(user).rebalanceLPRange(
        sessionId,
        mockPool,
        -887200,
        887200,
        0
      );
      await tx.wait();

      const details = await syrupSentinel.getAgentDetails();
      expect(details.totalTasks).to.equal(1);
      expect(details.successRate).to.equal(100);
    });
  });
});
