import { expect } from "chai";
import hre from "hardhat";

describe("PredictionManager", function () {
  it("Should return stub round data", async function () {
    const PredictionManager = await hre.ethers.getContractFactory("PredictionManager");
    const manager = await PredictionManager.deploy();
    await manager.waitForDeployment();

    const data = await manager.getRoundData();
    expect(data.roundId).to.equal(0);
  });
});
