import { parseAbiItem } from 'abitype'
import { createConfig, factory } from 'ponder'
import { BET_ABI, BET_FACTORY } from 'shared'
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
      ...BET_FACTORY,
    },
    Bet: {
      chain: 'base',
      abi: BET_ABI,
      startBlock: BET_FACTORY.startBlock,
      address: factory({
        address: BET_FACTORY.address,
        event: parseAbiItem('event BetCreated(address indexed bet)'),
        parameter: 'bet',
      }),
    },
  },
})
