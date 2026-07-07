import { HardhatRuntimeConfig } from "hardhat/config";
import { DeployFunction } from "hardhat-deploy/types";
import { config as dotconfig } from "dotenv";

dotconfig();

const deploy: DeployFunction = async (hre: HardhatRuntimeConfig) => {
  const { deploy, log } = hre.deployments;
  const { deployer } = await hre.deployments.getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying PredictionManager...");
  const prediction = await deploy("PredictionManager", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`PredictionManager deployed at ${prediction.address}`);

  log("----------------------------------------------------");
  log("Deploying RewardTreasury...");
  const treasury = await deploy("RewardTreasury", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`RewardTreasury deployed at ${treasury.address}`);

  log("----------------------------------------------------");
  log("Deploying PointsManager...");
  const points = await deploy("PointsManager", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`PointsManager deployed at ${points.address}`);

  log("----------------------------------------------------");
  log("Deploying SpinRewardManager...");
  const spin = await deploy("SpinRewardManager", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.live ? 5 : 1,
  });
  log(`SpinRewardManager deployed at ${spin.address}`);
};

export default deploy;
deploy.tags = ["vibepool"];
