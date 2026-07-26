import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { config as dotconfig } from "dotenv";
import { zeroAddress } from "viem";

dotconfig();

/** USDm on Celo mainnet (same address historically labeled cUSD). */
const USDM_MAINNET = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, execute, get } = deployments;
  const { deployer, usdmAddress } = await getNamedAccounts();

  if (network.name !== "hardhat" && network.config.chainId !== 42220) {
    throw new Error(`Refuse to deploy on ${network.name} — Celo mainnet (42220) only`);
  }

  log("----------------------------------------------------");
  log(`Network: ${network.name} chainId=${network.config.chainId}`);
  log("Deploying RewardTreasury...");
  const treasury = await deploy("RewardTreasury", {
    from: deployer,
    args: [zeroAddress],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`RewardTreasury deployed at ${treasury.address}`);

  log("----------------------------------------------------");
  log("Deploying ActivityRegistry...");
  const activity = await deploy("ActivityRegistry", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`ActivityRegistry deployed at ${activity.address}`);

  log("----------------------------------------------------");
  log("Deploying SpinRewardManager...");
  const spin = await deploy("SpinRewardManager", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`SpinRewardManager deployed at ${spin.address}`);

  log("----------------------------------------------------");
  log("Deploying PointsManager...");
  const points = await deploy("PointsManager", {
    from: deployer,
    args: [activity.address, spin.address],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`PointsManager deployed at ${points.address}`);

  // Enable USDm for MiniPay skill-fee deposits (mainnet / local mock skipped).
  if (network.config.chainId === 42220) {
    const usdm = (usdmAddress as string) || process.env.SUPPORTED_ASSET_USDM || USDM_MAINNET;
    log(`Enabling USDm asset ${usdm} on RewardTreasury...`);
    try {
      await execute(
        "RewardTreasury",
        { from: deployer, log: true },
        "enableAsset",
        usdm,
        "USDm",
        18
      );
    } catch (err) {
      log(`enableAsset skipped or already enabled: ${(err as Error).message}`);
    }

    const backendSigner = process.env.BACKEND_SIGNER;
    if (backendSigner && backendSigner.startsWith("0x")) {
      const treasuryDep = await get("RewardTreasury");
      const rewardRole = await deployments.read("RewardTreasury", "REWARD_MANAGER_ROLE");
      log(`Granting REWARD_MANAGER_ROLE to BACKEND_SIGNER ${backendSigner}`);
      try {
        await execute(
          "RewardTreasury",
          { from: deployer, log: true },
          "grantRole",
          rewardRole,
          backendSigner
        );
      } catch (err) {
        log(`grantRole skipped: ${(err as Error).message}`);
      }
      void treasuryDep;
    }
  }

  log("----------------------------------------------------");
  log("Vibepool foundation deploy complete (mainnet-ready).");
  log(`RewardTreasury: ${treasury.address}`);
  log(`ActivityRegistry: ${activity.address}`);
  log(`SpinRewardManager: ${spin.address}`);
  log(`PointsManager: ${points.address}`);
};

export default deploy;
deploy.tags = ["vibepool"];
