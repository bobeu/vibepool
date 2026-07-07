# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

## Commands

```shell
npx hardhat compile
npx hardhat test
npx hardhat clean
npx hardhat deploy --network celo
node scripts/sync-data.js
```

## Setup

1. Copy `.env.example` to `.env` and fill in your RPC keys and private keys.
2. Install dependencies: `npm install` or `yarn install`.
3. Compile: `npx hardhat compile`.
4. Test: `npx hardhat test`.
5. Deploy: `npx hardhat deploy --network celo`.

## Sync to Frontend

After deployment, run:
```shell
node scripts/sync-data.js
```

This mirrors the `vibecheck/smartContracts/sync-data.js` pattern — writes `addresses.json`, `abis.json`, and `index.ts` to `../lib/contracts/`.
