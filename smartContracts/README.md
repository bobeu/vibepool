# Nexora — Smart Contract Foundation

Hardhat + Foundry suite for Nexora on **Celo mainnet (42220)** only.

## Contracts

- `RewardTreasury.sol` — Central vault (native CELO + ERC20). Enable **USDm** after deploy for MiniPay skill fees.
- `PointsManager.sol` — On-chain player profile, XP, points, spins
- `ActivityRegistry.sol` — Activity history with streak tracking
- `SpinRewardManager.sol` — Spin ticket accounting and reward recording
- `MockERC20.sol` — Local/test asset only

## Libraries

- `libraries/AssetValidation.sol` — Asset enablement checks
- `libraries/LevelMath.sol` — XP to level conversion
- `libraries/TransferHelper.sol` — Safe native and ERC20 transfers

## Getting Started

```bash
bun install
cp .env.example .env
bun run compile
bun run test
```

## Mainnet deployment (you run this)

```bash
# Hardhat
bun run deploy-mainnet
bun run sync

# Or Foundry
forge script script/DeployVibepool.s.sol:DeployVibepool --rpc-url celo --broadcast --verify
```

After deploy, `sync-data.js` writes addresses/ABIs into `ui/lib/contracts/`.

**Post-deploy checklist**

1. Confirm `RewardTreasury` has USDm enabled (`0x765DE816845861e75A25fCA122bb6898B8B1282a`)
2. Grant `REWARD_MANAGER_ROLE` to backend signer
3. Set `NEXT_PUBLIC_*_ADDRESS` in the UI env
4. Fund treasury with CELO / USDm for reward payouts when settlement is enabled

## Testing

```bash
bun run test
bun run forge:test
```

Tests use Hardhat local network + MockERC20 labeled **USDm** (not a testnet).
