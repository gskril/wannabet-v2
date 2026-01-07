import { parseAbiItem } from 'abitype'
import { createConfig, factory } from 'ponder'
import { BET_FACTORY_V1, BET_FACTORY_V2, BET_V1_ABI, BET_V2_ABI } from 'shared'
import { base } from 'viem/chains'

export default createConfig({
  chains: {
    base: {
      id: base.id,
      rpc: 'https://mainnet.base.org',
    },
  },
  contracts: {
    BetFactory: {
      chain: 'base',
      ...BET_FACTORY_V1,
    },
    Bet: {
      chain: 'base',
      abi: BET_V1_ABI,
      startBlock: BET_FACTORY_V1.startBlock,
      address: factory({
        address: BET_FACTORY_V1.address,
        event: parseAbiItem('event BetCreated(address indexed bet)'),
        parameter: 'bet',
      }) as any,
    },
    BetFactoryV2: {
      chain: 'base',
      ...BET_FACTORY_V2,
    },
    Bet2: {
      chain: 'base',
      abi: BET_V2_ABI,
      startBlock: BET_FACTORY_V2.startBlock,
      address: factory({
        address: BET_FACTORY_V2.address,
        event: parseAbiItem('event BetCreated(address indexed bet)'),
        parameter: 'bet',
      }) as any,
    },
  },
})
