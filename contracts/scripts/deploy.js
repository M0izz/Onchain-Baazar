const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("  ONCHAIN BAZAAR — BSC TESTNET CONTRACT DEPLOYER  ");
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log(`Deploying with account: ${deployerAddress}`);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} tBNB`);

  if (balance < hre.ethers.parseEther("0.05")) {
    console.warn("\n⚠️  Low tBNB balance. Get testnet BNB from:");
    console.warn("   https://www.bnbchain.org/en/testnet-faucet\n");
  }

  // Official BSC Testnet Router Addresses (correct EIP-55 checksums)
  const PANCAKE_V3_ROUTER = "0x1B81D678fFB0c8B614eb42968695Da4E8c5A8c93";
  const PANCAKE_V2_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";

  // 1. AltanaSessionManager
  console.log("\n[1/5] Deploying AltanaSessionManager...");
  const AltanaSessionManager = await hre.ethers.getContractFactory("AltanaSessionManager");
  const sessionManager = await AltanaSessionManager.deploy();
  await sessionManager.waitForDeployment();
  const sessionManagerAddress = await sessionManager.getAddress();
  console.log(`  ✅ AltanaSessionManager: ${sessionManagerAddress}`);

  // 2. SyrupSentinelAgent
  console.log("\n[2/5] Deploying SyrupSentinelAgent...");
  const SyrupSentinelAgent = await hre.ethers.getContractFactory("SyrupSentinelAgent");
  const syrupSentinel = await SyrupSentinelAgent.deploy(
    sessionManagerAddress,
    PANCAKE_V3_ROUTER,
    PANCAKE_V2_ROUTER
  );
  await syrupSentinel.waitForDeployment();
  const syrupSentinelAddress = await syrupSentinel.getAddress();
  console.log(`  ✅ SyrupSentinelAgent: ${syrupSentinelAddress}`);

  // 3. VenusGuardianAgent
  console.log("\n[3/5] Deploying VenusGuardianAgent...");
  const VenusGuardianAgent = await hre.ethers.getContractFactory("VenusGuardianAgent");
  const venusGuardian = await VenusGuardianAgent.deploy(sessionManagerAddress);
  await venusGuardian.waitForDeployment();
  const venusGuardianAddress = await venusGuardian.getAddress();
  console.log(`  ✅ VenusGuardianAgent: ${venusGuardianAddress}`);

  // 4. YieldMaxAgent
  console.log("\n[4/5] Deploying YieldMaxAgent...");
  const YieldMaxAgent = await hre.ethers.getContractFactory("YieldMaxAgent");
  const yieldMax = await YieldMaxAgent.deploy(sessionManagerAddress);
  await yieldMax.waitForDeployment();
  const yieldMaxAddress = await yieldMax.getAddress();
  console.log(`  ✅ YieldMaxAgent: ${yieldMaxAddress}`);

  // 5. ChainWatchAgent
  console.log("\n[5/5] Deploying ChainWatchAgent...");
  const ChainWatchAgent = await hre.ethers.getContractFactory("ChainWatchAgent");
  const chainWatch = await ChainWatchAgent.deploy(sessionManagerAddress);
  await chainWatch.waitForDeployment();
  const chainWatchAddress = await chainWatch.getAddress();
  console.log(`  ✅ ChainWatchAgent: ${chainWatchAddress}`);

  const deployments = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 97,
    timestamp: new Date().toISOString(),
    deployer: deployerAddress,
    contracts: {
      AltanaSessionManager: sessionManagerAddress,
      SyrupSentinelAgent: syrupSentinelAddress,
      VenusGuardianAgent: venusGuardianAddress,
      YieldMaxAgent: yieldMaxAddress,
      ChainWatchAgent: chainWatchAddress,
    },
    external: {
      PancakeV3Router: PANCAKE_V3_ROUTER,
      PancakeV2Router: PANCAKE_V2_ROUTER,
    },
  };

  // Write deployments.json
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`\n📄  deployments.json written`);

  // Auto-run address sync to backend/.env and frontend addresses module
  console.log("\n🔄  Syncing addresses to backend + frontend...");
  try {
    require("./sync-addresses");
  } catch (e) {
    console.warn("  ⚠️  Auto-sync failed (run node scripts/sync-addresses.js manually):", e.message);
  }

  console.log("\n🎯  Deployment complete!");
  console.log(`\n   BscScan Testnet URLs:`);
  for (const [name, addr] of Object.entries(deployments.contracts)) {
    console.log(`   ${name}: https://testnet.bscscan.com/address/${addr}`);
  }

  console.log("\n   Next steps:");
  console.log("   1. node scripts/verify.js");
  console.log("   2. cd ../backend && python -m uvicorn main:app --reload");
  console.log("   3. cd ../frontend && npm run dev");

  return deployments;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
