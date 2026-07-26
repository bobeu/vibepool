import { expect } from "chai";
import hre from "hardhat";
import {
  parseEther,
  parseUnits,
  zeroAddress,
  keccak256,
  toBytes,
  parseSignature,
} from "viem";

async function signErc20Permit(params: {
  wallet: any;
  token: any;
  spender: `0x${string}`;
  value: bigint;
  deadline: bigint;
  chainId: number;
}) {
  const ownerAddr = params.wallet.account.address as `0x${string}`;
  const [name, nonce] = await Promise.all([
    params.token.read.name(),
    params.token.read.nonces([ownerAddr]),
  ]);
  const signature = await params.wallet.signTypedData({
    account: params.wallet.account,
    domain: {
      name,
      version: "1",
      chainId: params.chainId,
      verifyingContract: params.token.address,
    },
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    message: {
      owner: ownerAddr,
      spender: params.spender,
      value: params.value,
      nonce,
      deadline: params.deadline,
    },
  });
  const { r, s, v, yParity } = parseSignature(signature);
  return { v: Number(v ?? 27n + BigInt(yParity ?? 0)), r, s };
}

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
  let chainId: number;

  beforeEach(async function () {
    const viem = hre.viem;
    [owner, user, dbManager] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();
    chainId = await publicClient.getChainId();

    usdm = await viem.deployContract("MockERC20Permit", ["USDm", "USDm", 18]);
    usdc = await viem.deployContract("MockERC20Permit", ["USDC", "USDC", 6]);
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

  it("payEntryWithPermit is a single tx (no prior approve)", async function () {
    const amount = parseEther("5");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const { v, r, s } = await signErc20Permit({
      wallet: user,
      token: usdm,
      spender: economy.address,
      value: amount,
      deadline,
      chainId,
    });

    // No approve call — permit + pull in one write
    await economy.write.payEntryWithPermit(
      [usdm.address, amount, keccak256(toBytes("permit-entry")), deadline, v, r, s],
      { account: user.account }
    );

    expect(await treasury.read.assetBalance([usdm.address])).to.equal(parseEther("3.5"));
    expect(await vault.read.liquidBalance([usdm.address])).to.equal(parseEther("1.5"));
  });

  it("purchaseItemWithPermit is a single tx (no prior approve)", async function () {
    const amount = parseUnits("20", 6);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const { v, r, s } = await signErc20Permit({
      wallet: user,
      token: usdc,
      spender: economy.address,
      value: amount,
      deadline,
      chainId,
    });

    await economy.write.purchaseItemWithPermit(
      [keccak256(toBytes("shield")), usdc.address, amount, deadline, v, r, s],
      { account: user.account }
    );

    expect(await treasury.read.assetBalance([usdc.address])).to.equal(parseUnits("14", 6));
    expect(await vault.read.liquidBalance([usdc.address])).to.equal(parseUnits("6", 6));
  });
});
