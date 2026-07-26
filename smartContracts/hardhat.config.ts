import type { HardhatUserConfig } from "hardhat/config";
import { config as dotconfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@nomiclabs/hardhat-web3";
import "@nomicfoundation/hardhat-viem";

dotconfig();

const deployerKey =
  process.env.KEY_FAR?.replace(/[^a-fA-F0-9x]/g, "").slice(0, 66) ||
  process.env.PRIVATE_KEY?.replace(/[^a-fA-F0-9x]/g, "").slice(0, 66) ||
  "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 31337,
    },
    celo: {
      accounts: [deployerKey],
      url: process.env.CELO_RPC_URL || "https://forno.celo.org",
      chainId: 42220,
      saveDeployments: true,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
  },

  etherscan: {
    apiKey: process.env.CELOSCAN_API_KEY ?? "",
    customChains: [
      {
        chainId: 42220,
        network: "celo",
        urls: {
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      42220: `privatekey://${process.env.KEY_FAR || process.env.PRIVATE_KEY}`,
    },
    feeReceiver: {
      default: 0,
      42220: `privatekey://${process.env.TREASURE || process.env.KEY_FAR}`,
    },
    oracleAddress: {
      default: 0,
      42220: `privatekey://${process.env.MAIN_ORACLE || process.env.KEY_FAR}`,
    },
    allowedAgent: {
      default: 0,
      42220: `privatekey://${process.env.MAIN_ORACLE || process.env.KEY_FAR}`,
    },
    /** Pyth price feed (Celo mainnet) */
    pythAddress: {
      42220: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
    },
    /** Chainlink CELO/USD (Celo mainnet) */
    chainlinkCeloUsdAddress: {
      42220: "0x0568fD19986748cEfF3301e55c0eb1E729E0Ab7e",
    },
    /** Aave V3 pool (Celo mainnet) */
    aavePoolAddress: {
      42220: "0x341a1fbd51825e5a107db54ccb3166deba145479",
    },
    /** USDm (formerly marketed as cUSD) — same token address */
    usdmAddress: {
      42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    },
  },

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
};

export default config;
