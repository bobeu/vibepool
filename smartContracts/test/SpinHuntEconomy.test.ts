import { expect } from "chai";
import hre from "hardhat";
import { parseEther, parseUnits, zeroAddress, keccak256, toBytes } from "viem";

describe("SpinEconomy + SpinPrizeVault", function () {
  this.timeout(120000);

  let economy: any;
  let vault: any;
  let treasury: any;
  let usdm: any;
  let usdc: any;
  let owner: any;
  let user: any;
  let dbManager: any;

  beforeEach(async function () {
    const viem = hre.viem;
    [owner, user, dbManager] = await viem.getWalletClients();

    usdm = await viem.deployContract("MockERC20", ["USDm", "USDm", 18]);
    usdc = await viem.deployContract("MockERC20", ["USDC", "USDC", 6]);
    await usdm.write.mint([user.account.address, parseEther("1000")]);
    await usdc.write.mint([user.account.address, parseUnits("1000", 6)]);

    treasury = await viem.deployContract("contracts/RewardTreasury.sol:RewardTreasury", [zeroAddress]);
    vault = await viem.deployContract("contracts/SpinPrizeVault.sol:SpinPrizeVault", [zeroAddress]);
    economy = await viem.deployContract("contracts/SpinEconomy.sol:SpinEconomy", [
      zeroAddress,
      treasury.address,
      vault.address,
      7000,
    ]);

    await treasury.write.enableAsset([usdm.address, "USDm", 18], { account: owner.account });
    await treasury.write.enableAsset([usdc.address, "USDC", 6], { account: owner.account });
    await vault.write.enableAsset([usdm.address, "USDm", 18], { account: owner.account });
    await vault.write.enableAsset([usdc.address, "USDC", 6], { account: owner.account });
    await economy.write.enableAsset([usdm.address, 18], { account: owner.account });
    await economy.write.enableAsset([usdc.address, 6], { account: owner.account });

    const dbRole = await vault.read.DB_MANAGER_ROLE();
    await vault.write.grantRole([dbRole, dbManager.account.address], { account: owner.account });
  });

  it("splits CELO entry fee to treasury and vault", async function () {
    const amount = parseEther("1");
    await economy.write.payEntry([zeroAddress, 0n, keccak256(toBytes("s1"))], {
      account: user.account,
      value: amount,
    });

    const treasuryBal = await treasury.read.treasuryBalance();
    const vaultBal = await vault.read.liquidBalance([zeroAddress]);
    expect(treasuryBal).to.equal(parseEther("0.7"));
    expect(vaultBal).to.equal(parseEther("0.3"));
  });

  it("splits USDm purchase via contract (not raw transfer)", async function () {
    const amount = parseEther("10");
    await usdm.write.approve([economy.address, amount], { account: user.account });
    await economy.write.purchaseItem([keccak256(toBytes("buzzer")), usdm.address, amount], {
      account: user.account,
    });

    expect(await treasury.read.assetBalance([usdm.address])).to.equal(parseEther("7"));
    expect(await vault.read.liquidBalance([usdm.address])).to.equal(parseEther("3"));
  });

  it("credits reward and allows withdraw when liquid", async function () {
    await owner.sendTransaction({ to: vault.address, value: parseEther("5") });
    const req = keccak256(toBytes("r1"));
    await vault.write.creditReward(
      [user.account.address, zeroAddress, parseEther("1"), req],
      { account: dbManager.account }
    );

    expect(await vault.read.claimable([user.account.address, zeroAddress])).to.equal(parseEther("1"));
    expect(await vault.read.canWithdraw([user.account.address, zeroAddress, parseEther("1")])).to.equal(
      true
    );

    await vault.write.withdraw([zeroAddress, parseEther("1")], { account: user.account });
    expect(await vault.read.claimable([user.account.address, zeroAddress])).to.equal(0n);
  });

  it("rejects credit when vault underfunded", async function () {
    const req = keccak256(toBytes("r2"));
    await expect(
      vault.write.creditReward(
        [user.account.address, zeroAddress, parseEther("1"), req],
        { account: dbManager.account }
      )
    ).to.be.rejected;
  });

  it("rejects duplicate credit requestId", async function () {
    await owner.sendTransaction({ to: vault.address, value: parseEther("2") });
    const req = keccak256(toBytes("dup"));
    await vault.write.creditReward(
      [user.account.address, zeroAddress, parseEther("1"), req],
      { account: dbManager.account }
    );
    await expect(
      vault.write.creditReward(
        [user.account.address, zeroAddress, parseEther("1"), req],
        { account: dbManager.account }
      )
    ).to.be.rejected;
  });
});
