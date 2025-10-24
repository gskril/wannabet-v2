import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Use custom RPC if provided, otherwise fall back to public RPC
const baseRpcUrl =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({
      // Support all injected wallets (MetaMask, Coinbase Wallet, etc.)
      shimDisconnect: true,
    }),
  ],
  transports: {
    [base.id]: http(baseRpcUrl),
  },
})
