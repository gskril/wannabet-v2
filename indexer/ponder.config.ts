import { parseAbiItem } from 'abitype'
import { createConfig, factory } from 'ponder'
import { BET_FACTORY_V1, BET_FACTORY_V2, BET_V1_ABI, BET_V2_ABI } from 'shared'
import { fallback, webSocket } from 'viem'
import { base } from 'viem/chains'

const BASE_RPC_URL = process.env.BASE_RPC_URL

// Prefer dedicated RPC, fall back to public endpoints
const rpcUrls = BASE_RPC_URL
  ? [BASE_RPC_URL, 'https://base-rpc.publicnode.com', 'https://base.llamarpc.com']
  : ['https://base-rpc.publicnode.com', 'https://base.llamarpc.com']

// Derive WebSocket URL from HTTP URL (works for Alchemy, Infura, etc.)
const wsUrl = BASE_RPC_URL?.replace('https://', 'wss://') ?? 'wss://base-rpc.publicnode.com'

export default createConfig({
  chains: {
    base: {
      id: base.id,
      rpc: rpcUrls,
      ws: wsUrl,
    },
  },
  contracts: {
    BetFactory: {
      chain: 'base',
      abi: BET_FACTORY_V1.abi,
      startBlock: BET_FACTORY_V1.startBlock,
      address: BET_FACTORY_V1.address,
    },
    Bet: {
      chain: 'base',
      abi: BET_V1_ABI,
      startBlock: BET_FACTORY_V1.startBlock,
      address: factory({
        address: BET_FACTORY_V1.address,
        event: parseAbiItem('event BetCreated(address indexed bet)'),
        parameter: 'bet',
      }),
    },
    Bet2Factory: {
      chain: 'base',
      abi: BET_FACTORY_V2.abi,
      startBlock: BET_FACTORY_V2.startBlock,
      address: BET_FACTORY_V2.address,
    },
    Bet2: {
      chain: 'base',
      abi: BET_V2_ABI,
      startBlock: BET_FACTORY_V2.startBlock,
      address: factory({
        address: BET_FACTORY_V2.address,
        event: parseAbiItem('event BetCreated(address indexed bet)'),
        parameter: 'bet',
      }),
    },
  },
})
