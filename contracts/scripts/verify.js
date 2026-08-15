/**
 * BscScan Contract Verification Script
 * Run after sync-addresses.js to verify all deployed contracts on BscScan Testnet.
 * Usage: node scripts/verify.js
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentsPath = path.join(__dirname, "../deployments.json");

  if (!fs.existsSync(deploymentsPath)) {
    console.error("❌  deployments.json not found. Run deploy:testnet first.");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const { contracts, external } = deployments;

  console.log("================================================");
  console.log("  ONCHAIN BAZAAR — BSCSCAN TESTNET VERIFIER    ");
  console.log("================================================\n");

  // 1. Verify AltanaSessionManager (no constructor args)
  console.log("[1/5] Verifying AltanaSessionManager...");
  try {
    await hre.run("verify:verify", {
      address: contracts.AltanaSessionManager,
      constructorArguments: [],
    });
    console.log("  ✅ AltanaSessionManager verified");
  } catch (e) {
    console.log(`  ⚠️  AltanaSessionManager: ${e.message.slice(0, 80)}`);
  }

  // 2. Verify SyrupSentinelAgent
  console.log("\n[2/5] Verifying SyrupSentinelAgent...");
  try {
    await hre.run("verify:verify", {
      address: contracts.SyrupSentinelAgent,
      constructorArguments: [
        contracts.AltanaSessionManager,
        external.PancakeV3Router,
        external.PancakeV2Router,
      ],
    });
    console.log("  ✅ SyrupSentinelAgent verified");
  } catch (e) {
    console.log(`  ⚠️  SyrupSentinelAgent: ${e.message.slice(0, 80)}`);
  }

  // 3. Verify VenusGuardianAgent
  console.log("\n[3/5] Verifying VenusGuardianAgent...");
  try {
    await hre.run("verify:verify", {
      address: contracts.VenusGuardianAgent,
      constructorArguments: [contracts.AltanaSessionManager],
    });
    console.log("  ✅ VenusGuardianAgent verified");
  } catch (e) {
    console.log(`  ⚠️  VenusGuardianAgent: ${e.message.slice(0, 80)}`);
  }

  // 4. Verify YieldMaxAgent
  console.log("\n[4/5] Verifying YieldMaxAgent...");
  try {
    await hre.run("verify:verify", {
      address: contracts.YieldMaxAgent,
      constructorArguments: [contracts.AltanaSessionManager],
    });
    console.log("  ✅ YieldMaxAgent verified");
  } catch (e) {
    console.log(`  ⚠️  YieldMaxAgent: ${e.message.slice(0, 80)}`);
  }

  // 5. Verify ChainWatchAgent
  console.log("\n[5/5] Verifying ChainWatchAgent...");
  try {
    await hre.run("verify:verify", {
      address: contracts.ChainWatchAgent,
      constructorArguments: [contracts.AltanaSessionManager],
    });
    console.log("  ✅ ChainWatchAgent verified");
  } catch (e) {
    console.log(`  ⚠️  ChainWatchAgent: ${e.message.slice(0, 80)}`);
  }

  console.log("\n🎉  Verification complete! View contracts on BscScan Testnet:");
  for (const [name, addr] of Object.entries(contracts)) {
    console.log(`   ${name}: https://testnet.bscscan.com/address/${addr}#code`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
