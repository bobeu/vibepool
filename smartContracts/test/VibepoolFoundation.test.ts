import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import hre from "hardhat";
import { parseEther, zeroAddress } from "viem";

chaiAsPromised.transferPromiseness = (assertion: any, promise: any) => {
  assertion.then = promise.then.bind(promise);
  assertion.catch = promise.catch.bind(promise);
};

describe("Vibepool Foundation Contracts", function () {
  this.timeout(120000);

  describe("RewardTreasury", function () {
    let rewardTreasury: any;
    let asset: any;
    let owner: any, treasuryManager: any, rewardManager: any, pauser: any, user: any;

    beforeEach(async function () {
      const viem = hre.viem;
      [owner, treasuryManager, rewardManager, pauser, user] = await viem.getWalletClients();

      asset = await viem.deployContract("MockERC20", ["Test USDM", "USDM", 18]);
      await asset.write.mint([owner.account.address, parseEther("10000")]);

      rewardTreasury = await viem.deployContract("contracts/RewardTreasury.sol:RewardTreasury", [
        zeroAddress
      ]);

      await rewardTreasury.write.grantRole([
        rewardTreasury.read.TREASURY_MANAGER_ROLE(),
        treasuryManager.account.address
      ], { account: owner.account });
      await rewardTreasury.write.grantRole([
        rewardTreasury.read.REWARD_MANAGER_ROLE(),
        rewardManager.account.address
      ], { account: owner.account });
      await rewardTreasury.write.grantRole([
        rewardTreasury.read.PAUSER_ROLE(),
        pauser.account.address
      ], { account: owner.account });

      await asset.write.approve([rewardTreasury.address, parseEther("1000")], { account: owner.account });
    });

    it("Should initialize with CELO as supported asset", async function () {
      const assets = await rewardTreasury.read.getSupportedAssets();
      expect(assets.length).to.equal(1);
      expect(assets[0].assetAddress).to.equal(zeroAddress);
      expect(assets[0].symbol).to.equal("CELO");
    });

    it("Should accept native CELO deposit", async function () {
      const amount = parseEther("10");
      await owner.sendTransaction({
        to: rewardTreasury.address,
        value: amount
      });

      const balance = await rewardTreasury.read.treasuryBalance();
      expect(balance).to.equal(amount);
    });

    it("Should accept ERC20 deposit", async function () {
      const amount = parseEther("100");
      await rewardTreasury.write.depositERC20([asset.address, amount], { account: owner.account });

      const assetBal = await rewardTreasury.read.assetBalance([asset.address]);
      expect(assetBal).to.equal(amount);
    });

    it("Should reject unsupported asset deposits", async function () {
      const unsupported = await viem.deployContract("MockERC20", ["Bad", "BAD", 18]);
      await expect(
        rewardTreasury.write.depositERC20([unsupported.address, parseEther("10")], { account: owner.account })
      ).to.be.rejected;
    });

    it("Should allow treasury manager to withdraw", async function () {
      const amount = parseEther("5");
      await owner.sendTransaction({
        to: rewardTreasury.address,
        value: amount
      });

      const before = await owner.getBalance();
      const tx = await rewardTreasury.write.withdraw([zeroAddress, treasuryManager.account.address, amount], { account: treasuryManager.account });
      const receipt = await viem.waitForTransactionReceipt({ hash: tx });
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
      const after = await owner.getBalance();

      expect(after - before + gasUsed).to.equal(amount);
    });

    it("Should reject unauthorized withdrawal", async function () {
      await expect(
        rewardTreasury.write.withdraw([zeroAddress, user.account.address, parseEther("1")], { account: user.account })
      ).to.be.rejected;
    });

    it("Should allow reward manager to payout and prevent double payout", async function () {
      const amount = parseEther("10");
      await owner.sendTransaction({
        to: rewardTreasury.address,
        value: amount
      });

      const requestId = "0x" + "11".repeat(32);
      await rewardTreasury.write.payout([user.account.address, zeroAddress, amount, requestId], { account: rewardManager.account });

      await expect(
        rewardTreasury.write.payout([user.account.address, zeroAddress, amount, requestId], { account: rewardManager.account })
      ).to.be.rejectedWith(/DuplicateRequestId/);
    });

    it("Should allow admin to enable/disable assets", async function () {
      await rewardTreasury.write.enableAsset([asset.address, "USDM", 18], { account: owner.account });
      const assets = await rewardTreasury.read.getSupportedAssets();
      expect(assets.length).to.equal(2);

      await rewardTreasury.write.disableAsset([asset.address], { account: owner.account });
      const info = await rewardTreasury.read.assets([asset.address]);
      expect(info.enabled).to.equal(false);
    });

    it("Should allow pauser to pause and unpause", async function () {
      await rewardTreasury.write.pause({ account: pauser.account });
      await expect(
        owner.sendTransaction({ to: rewardTreasury.address, value: parseEther("1") })
      ).to.be.rejected;

      await rewardTreasury.write.unpause({ account: pauser.account });
      await owner.sendTransaction({ to: rewardTreasury.address, value: parseEther("1") });
    });

    it("Should reject unauthorized pause", async function () {
      await expect(
        rewardTreasury.write.pause({ account: user.account })
      ).to.be.rejected;
    });

    it("Should track treasury statistics", async function () {
      const amount = parseEther("10");
      await owner.sendTransaction({
        to: rewardTreasury.address,
        value: amount
      });

      const stats = await rewardTreasury.read.treasuryStatistics();
      expect(stats.totalDeposits).to.equal(amount);
    });

    it("Should reject withdrawal with insufficient balance", async function () {
      await expect(
        rewardTreasury.write.withdraw([zeroAddress, treasuryManager.account.address, parseEther("1")], { account: treasuryManager.account })
      ).to.be.rejectedWith(/InsufficientBalance/);
    });

    it("Should reject payout with insufficient balance", async function () {
      const requestId = "0x" + "b1".repeat(32);
      await expect(
        rewardTreasury.write.payout([user.account.address, zeroAddress, parseEther("1"), requestId], { account: rewardManager.account })
      ).to.be.rejectedWith(/InsufficientBalance/);
    });

    it("Should reject payout for disabled asset", async function () {
      await rewardTreasury.write.enableAsset([asset.address, "USDM", 18], { account: owner.account });
      await rewardTreasury.write.disableAsset([asset.address], { account: owner.account });
      
      const requestId = "0x" + "c1".repeat(32);
      await expect(
        rewardTreasury.write.payout([user.account.address, asset.address, parseEther("1"), requestId], { account: rewardManager.account })
      ).to.be.rejected;
    });
  });

  describe("PointsManager", function () {
    let pointsManager: any;
    let owner: any, backend: any, user: any;

    beforeEach(async function () {
      const viem = hre.viem;
      [owner, backend, user] = await viem.getWalletClients();

      pointsManager = await viem.deployContract("contracts/PointsManager.sol:PointsManager", [
        zeroAddress,
        zeroAddress
      ]);

      await pointsManager.write.grantRole([pointsManager.read.BACKEND_ROLE(), backend.account.address], { account: owner.account });
    });

    it("Should grant XP and auto-calculate level", async function () {
      const requestId = "0x" + "aa".repeat(32);
      await pointsManager.write.grantXP([user.account.address, 1500, requestId], { account: backend.account });

      const profile = await pointsManager.read.profiles([user.account.address]);
      expect(profile.xp).to.equal(1500);
      expect(profile.level).to.equal(1);
    });

    it("Should increase level when XP crosses threshold", async function () {
      const requestId1 = "0x" + "a1".repeat(32);
      const requestId2 = "0x" + "a2".repeat(32);

      await pointsManager.write.grantXP([user.account.address, 800, requestId1], { account: backend.account });
      await pointsManager.write.grantXP([user.account.address, 300, requestId2], { account: backend.account });

      const profile = await pointsManager.read.profiles([user.account.address]);
      expect(profile.xp).to.equal(1100);
      expect(profile.level).to.equal(1);
    });

    it("Should emit LevelUp event when level increases", async function () {
      const requestId = "0x" + "a3".repeat(32);
      await pointsManager.write.grantXP([user.account.address, 1001, requestId], { account: backend.account });

      const filter = pointsManager.functions.LevelUp.filter(user.account.address);
      const logs = await pointsManager.queryFilter(filter);
      expect(logs.length).to.equal(1);
      expect(logs[0].args.newLevel).to.equal(1);
    });

    it("Should grant points and lifetime points", async function () {
      const requestId = "0x" + "bb".repeat(32);
      await pointsManager.write.grantPoints([user.account.address, 500, requestId], { account: backend.account });

      const profile = await pointsManager.read.profiles([user.account.address]);
      expect(profile.points).to.equal(500);
      expect(profile.lifetimePoints).to.equal(500);
    });

    it("Should deduct points with underflow protection", async function () {
      const grantId = "0x" + "cc".repeat(32);
      const deductId = "0x" + "dd".repeat(32);
      await pointsManager.write.grantPoints([user.account.address, 300, grantId], { account: backend.account });

      await expect(
        pointsManager.write.deductPoints([user.account.address, 500, deductId], { account: backend.account })
      ).to.be.rejectedWith(/InsufficientBalance/);
    });

    it("Should grant spins", async function () {
      const requestId = "0x" + "ee".repeat(32);
      await pointsManager.write.grantSpin([user.account.address, 3, requestId], { account: backend.account });

      const profile = await pointsManager.read.profiles([user.account.address]);
      expect(profile.availableSpins).to.equal(3);
    });

    it("Should batch grant XP", async function () {
      const requestIds = ["0x" + "a1".repeat(32), "0x" + "a2".repeat(32)];
      await pointsManager.write.batchGrantXP([
        [user.account.address, zeroAddress],
        [1000n, 2000n],
        requestIds
      ], { account: backend.account });

      const profile = await pointsManager.read.profiles([user.account.address]);
      expect(profile.xp).to.equal(1000);
    });

    it("Should reject duplicate request IDs", async function () {
      const requestId = "0x" + "ff".repeat(32);
      await pointsManager.write.grantXP([user.account.address, 1000, requestId], { account: backend.account });
      await expect(
        pointsManager.write.grantXP([user.account.address, 1000, requestId], { account: backend.account })
      ).to.be.rejectedWith(/DuplicateRequestId/);
    });

    it("Should reject unauthorized backend calls", async function () {
      await expect(
        pointsManager.write.grantXP([user.account.address, 1000, "0x" + "00".repeat(32)], { account: user.account })
      ).to.be.rejected;
    });
  });

  describe("ActivityRegistry", function () {
    let activityRegistry: any;
    let owner: any, backend: any, user: any;

    beforeEach(async function () {
      const viem = hre.viem;
      [owner, backend, user] = await viem.getWalletClients();

      activityRegistry = await viem.deployContract("contracts/ActivityRegistry.sol:ActivityRegistry");

      await activityRegistry.write.grantRole([activityRegistry.read.BACKEND_ROLE(), backend.account.address], { account: owner.account });
    });

    it("Should record activity and initialize streak", async function () {
      const requestId = "0x" + "11".repeat(32);
      await activityRegistry.write.recordActivity([user.account.address, requestId], { account: backend.account });

      const profile = await activityRegistry.read.activityProfiles([user.account.address]);
      expect(profile.activityCount).to.equal(1);
      expect(profile.currentStreak).to.equal(1);
      expect(profile.longestStreak).to.equal(1);
    });

    it("Should increase streak on consecutive days", async function () {
      const requestId1 = "0x" + "21".repeat(32);
      const requestId2 = "0x" + "22".repeat(32);

      await activityRegistry.write.recordActivity([user.account.address, requestId1], { account: backend.account });

      const viem = hre.viem;
      const time = (await import("@nomicfoundation/hardhat-network-helpers")).time;
      await time.increase(1 days);

      await activityRegistry.write.recordActivity([user.account.address, requestId2], { account: backend.account });

      const profile = await activityRegistry.read.activityProfiles([user.account.address]);
      expect(profile.currentStreak).to.equal(2);
      expect(profile.longestStreak).to.equal(2);
    });

    it("Should reset streak after gap", async function () {
      const requestId1 = "0x" + "31".repeat(32);
      const requestId2 = "0x" + "32".repeat(32);

      await activityRegistry.write.recordActivity([user.account.address, requestId1], { account: backend.account });

      const viem = hre.viem;
      const time = (await import("@nomicfoundation/hardhat-network-helpers")).time;
      await time.increase(2 days);

      await activityRegistry.write.recordActivity([user.account.address, requestId2], { account: backend.account });

      const profile = await activityRegistry.read.activityProfiles([user.account.address]);
      expect(profile.currentStreak).to.equal(1);
      expect(profile.longestStreak).to.equal(1);
    });

    it("Should reject duplicate activity request IDs", async function () {
      const requestId = "0x" + "41".repeat(32);
      await activityRegistry.write.recordActivity([user.account.address, requestId], { account: backend.account });
      await expect(
        activityRegistry.write.recordActivity([user.account.address, requestId], { account: backend.account })
      ).to.be.rejectedWith(/DuplicateRequestId/);
    });

    it("Should reset streak", async function () {
      const requestId = "0x" + "51".repeat(32);
      await activityRegistry.write.recordActivity([user.account.address, requestId], { account: backend.account });

      await activityRegistry.write.resetStreak([user.account.address], { account: backend.account });

      const profile = await activityRegistry.read.activityProfiles([user.account.address]);
      expect(profile.currentStreak).to.equal(0);
      expect(profile.longestStreak).to.equal(1);
    });
  });

  describe("SpinRewardManager", function () {
    let spinRewardManager: any;
    let owner: any, backend: any, user: any;

    beforeEach(async function () {
      const viem = hre.viem;
      [owner, backend, user] = await viem.getWalletClients();

      spinRewardManager = await viem.deployContract("contracts/SpinRewardManager.sol:SpinRewardManager");

      await spinRewardManager.write.grantRole([spinRewardManager.read.BACKEND_ROLE(), backend.account.address], { account: owner.account });
    });

    it("Should grant spins", async function () {
      const requestId = "0x" + "51".repeat(32);
      await spinRewardManager.write.grantSpin([user.account.address, 5, requestId], { account: backend.account });

      const profile = await spinRewardManager.read.spinProfiles([user.account.address]);
      expect(profile.availableSpins).to.equal(5);
      expect(profile.lifetimeSpinsEarned).to.equal(5);
    });

    it("Should consume spins", async function () {
      const grantId = "0x" + "61".repeat(32);
      const consumeId = "0x" + "62".repeat(32);

      await spinRewardManager.write.grantSpin([user.account.address, 2, grantId], { account: backend.account });
      await spinRewardManager.write.consumeSpin([user.account.address, consumeId], { account: backend.account });

      const profile = await spinRewardManager.read.spinProfiles([user.account.address]);
      expect(profile.availableSpins).to.equal(1);
      expect(profile.lifetimeSpinsUsed).to.equal(1);
    });

    it("Should reject consume when no spins available", async function () {
      const requestId = "0x" + "71".repeat(32);
      await expect(
        spinRewardManager.write.consumeSpin([user.account.address, requestId], { account: backend.account })
      ).to.be.rejectedWith(/NoSpinRemaining/);
    });

    it("Should record rewards", async function () {
      const requestId = "0x" + "81".repeat(32);
      await spinRewardManager.write.recordReward([user.account.address, parseEther("1.5"), requestId], { account: backend.account });

      const profile = await spinRewardManager.read.spinProfiles([user.account.address]);
      expect(profile.lifetimeRewards).to.equal(parseEther("1.5"));
    });

    it("Should reject duplicate request IDs", async function () {
      const requestId = "0x" + "91".repeat(32);
      await spinRewardManager.write.grantSpin([user.account.address, 1, requestId], { account: backend.account });
      await expect(
        spinRewardManager.write.grantSpin([user.account.address, 1, requestId], { account: backend.account })
      ).to.be.rejectedWith(/DuplicateRequestId/);
    });

    it("Should track statistics", async function () {
      const requestId = "0x" + "a1".repeat(32);
      await spinRewardManager.write.grantSpin([user.account.address, 10, requestId], { account: backend.account });

      const stats = await spinRewardManager.read.spinStatistics();
      expect(stats.totalSpinsGranted).to.equal(10);
    });
  });
});
