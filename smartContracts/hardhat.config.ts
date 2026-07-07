import type { HardhatUserConfig } from "hardhat/config";
import { config as dotconfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@nomiclabs/hardhat-web3";
import "@nomicfoundation/hardhat-viem";
import { zeroAddress } from "viem";

dotconfig();

const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      accounts: [process.env.KEY_ROUTE ? process.env.KEY_ROUTE.replace(/[^a-fA-F0-9x]/g, '').slice(0, 66) : "0x0000000000000000000000000000000000000000000000000000000000000001"],
      chainId: 11_142220,
      saveDeployments: true
    },
    celo: {
      accounts: [process.env.KEY_FAR ? process.env.KEY_FAR.replace(/[^a-fA-F0-9x]/g, '').slice(0, 66) : "0x0000000000000000000000000000000000000000000000000000000000000001"],
      url: "https://forno.celo.org",
      chainId: 42220,
      saveDeployments: true
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy"
  },
  etherscan: {
    apiKey: process.env.CELOSCAN_API_KEY ?? '',
    customChains: [
      {
        chainId: 11142220,
        network: "celoSepolia",
        urls: {
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://sepolia.celoscan.io"
        }
      },
      {
        chainId: 42220,
        network: "celo",
        urls: {
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://celoscan.io/"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
  namedAccounts: {
    deployer: {
      default: 0,
      11142220: `privatekey://${process.env.KEY_ROUTE}`,
      42220: `privatekey://${process.env.KEY_FAR}`
    },
    feeReceiver: {
      default: 0,
      11142220: `privatekey://${process.env.TREASURE}`,
      42220: `privatekey://${process.env.TREASURE}`
    },
    oracleAddress: {
      default: 0,
      11142220: `privatekey://${process.env.TEST_ORACLE}`,
      42220: `privatekey://${process.env.MAIN_ORACLE}`
    },
    allowedAgent: {
      default: 0,
      11142220: `privatekey://${process.env.TEST_ORACLE}`,
      42220: `privatekey://${process.env.MAIN_ORACLE}`
    },
    pythAddress: {
      42220: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
      11142220: "0x2880aB155794e7179c9eE2e38200202908C17B43"
    },
    chainlinkCeloUsdAddress: {
      42220: "0x0568fD19986748cEfF3301e55c0eb1E729E0Ab7e",
      11142220: "0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946"
    },
    aavePoolAddress: {
      42220: "0x341a1fbd51825e5a107db54ccb3166deba145479",
      11142220: zeroAddress
    }
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "cancun"
    }
  }
};

export default config;
