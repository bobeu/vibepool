import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { config as dotconfig } from "dotenv";
import { zeroAddress } from "viem";

dotconfig();

const USDM = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDT = "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, execute, get } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name !== "hardhat" && network.config.chainId !== 42220) {
    throw new Error(`Refuse to deploy on ${network.name} — Celo mainnet (42220) only`);
  }

  const confirmations = hre.network.live ? 5 : 1;

  log("Deploying RewardTreasury...");
  const treasury = await deploy("RewardTreasury", {
    from: deployer,
    args: [zeroAddress],
    log: true,
    waitConfirmations: confirmations,
  });

  log("Deploying ActivityRegistry...");
  const activity = await deploy("ActivityRegistry", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: confirmations,
  });

  log("Deploying SpinRewardManager...");
  const spin = await deploy("SpinRewardManager", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: confirmations,
  });

  log("Deploying PointsManager...");
  const points = await deploy("PointsManager", {
    from: deployer,
    args: [activity.address, spin.address],
    log: true,
    waitConfirmations: confirmations,
  });

  log("Deploying SpinPrizeVault...");
  const vault = await deploy("SpinPrizeVault", {
    from: deployer,
    args: [zeroAddress],
    log: true,
    waitConfirmations: confirmations,
  });

  const treasuryBps = Number(process.env.SPIN_TREASURY_BPS ?? 7000);
  log("Deploying SpinEconomy...");
  const economy = await deploy("SpinEconomy", {
    from: deployer,
    args: [zeroAddress, treasury.address, vault.address, treasuryBps],
    log: true,
    waitConfirmations: confirmations,
  });

  if (network.config.chainId === 42220 || network.name === "hardhat") {
    const assets: Array<{ addr: string; symbol: string; decimals: number }> = [
      { addr: process.env.SUPPORTED_ASSET_USDM || USDM, symbol: "USDm", decimals: 18 },
      { addr: process.env.SUPPORTED_ASSET_USDC || USDC, symbol: "USDC", decimals: 6 },
      { addr: process.env.SUPPORTED_ASSET_USDT || USDT, symbol: "USDT", decimals: 6 },
    ];

    for (const a of assets) {
      for (const [name, enableArgs] of [
        ["RewardTreasury", [a.addr, a.symbol, a.decimals]],
        ["SpinPrizeVault", [a.addr, a.symbol, a.decimals]],
        ["SpinEconomy", [a.addr, a.decimals]],
      ] as const) {
        try {
          await execute(name, { from: deployer, log: true }, "enableAsset", ...enableArgs);
        } catch (err) {
          log(`${name}.enableAsset(${a.symbol}) skipped: ${(err as Error).message}`);
        }
      }
    }

    const dbManager = process.env.DB_MANAGER || process.env.BACKEND_SIGNER;
    if (dbManager?.startsWith("0x")) {
      try {
        const role = await deployments.read("SpinPrizeVault", "DB_MANAGER_ROLE");
        await execute(
          "SpinPrizeVault",
          { from: deployer, log: true },
          "grantRole",
          role,
          dbManager
        );
      } catch (err) {
        log(`grant DB_MANAGER_ROLE skipped: ${(err as Error).message}`);
      }
    }

    const backendSigner = process.env.BACKEND_SIGNER;
    if (backendSigner?.startsWith("0x")) {
      try {
        const rewardRole = await deployments.read("RewardTreasury", "REWARD_MANAGER_ROLE");
        await execute(
          "RewardTreasury",
          { from: deployer, log: true },
          "grantRole",
          rewardRole,
          backendSigner
        );
      } catch (err) {
        log(`grant REWARD_MANAGER_ROLE skipped: ${(err as Error).message}`);
      }
    }
  }

  void get;
  log("Deploy complete:", {
    treasury: treasury.address,
    activity: activity.address,
    spin: spin.address,
    points: points.address,
    vault: vault.address,
    economy: economy.address,
  });
};

export default deploy;
deploy.tags = ["vibepool"];
