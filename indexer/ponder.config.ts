import { parseAbiItem } from 'abitype'
import { createConfig, factory } from 'ponder'
import { BET_FACTORY_V1, BET_V1_ABI } from 'shared'
import { base } from 'viem/chains'

export default createConfig({
  chains: {
    base: {
      id: base.id,
      rpc: 'https://base-rpc.publicnode.com',
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
  },
})
