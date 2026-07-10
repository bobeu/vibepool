import { HardhatRuntimeEnvironment, } from 'hardhat/types';
import { DeployFunction } from "hardhat-deploy/types";
import { config as dotconfig } from "dotenv";

dotconfig();

const deploy: DeployFunction = async (hre:HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
	const { deploy, log, read, execute } = deployments;
  let { deployer } = await getNamedAccounts();
  log("----------------------------------------------------");
  log("Deploying RewardTreasury...");
  const treasury = await deploy("RewardTreasury", {
    from: deployer,
    args: ["0x0000000000000000000000000000000000000000"],
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
};

export default deploy;
deploy.tags = ["vibepool"];
