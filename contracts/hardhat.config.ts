import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem'
import hardhatVerify from '@nomicfoundation/hardhat-verify'
import type { HardhatUserConfig } from 'hardhat/config'
import { configVariable } from 'hardhat/config'

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatVerify],
  paths: {
    sources: 'src',
  },
  solidity: {
    profiles: {
      default: {
        version: '0.8.28',
      },
      production: {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: 'edr-simulated',
      chainType: 'l1',
    },
    hardhatOp: {
      type: 'edr-simulated',
      chainType: 'op',
    },
    base: {
      type: 'http',
      chainType: 'op',
      url: 'https://base-rpc.publicnode.com',
      accounts: [configVariable('DEPLOYER_PRIVATE_KEY')],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable('ETHERSCAN_API_KEY'),
    },
  },
  ignition: {
    strategyConfig: {
      create2: {
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
    },
  },
}

export default config
