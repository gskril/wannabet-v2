import { sdk } from '@farcaster/miniapp-sdk'
import { createConfig, http, type CreateConnectorFn } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { createConnector } from 'wagmi'
import type { EIP1193Provider } from 'viem'

// Use custom RPC if provided, otherwise fall back to public RPC
const baseRpcUrl =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'

// Create a connector for Farcaster MiniApp's wallet provider
function farcasterFrame(): CreateConnectorFn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createConnector((config) => {
    async function doConnect() {
      const provider = sdk.wallet.ethProvider
      if (!provider) {
        throw new Error('Farcaster wallet provider not available')
      }

      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as readonly `0x${string}`[]

      const chainId = (await provider.request({
        method: 'eth_chainId',
      })) as string

      return {
        accounts,
        chainId: parseInt(chainId, 16),
      }
    }

    async function doGetAccounts() {
      const provider = sdk.wallet.ethProvider
      if (!provider) return []

      const accounts = (await provider.request({
        method: 'eth_accounts',
      })) as readonly `0x${string}`[]

      return accounts
    }

    return {
      id: 'farcaster-frame',
      name: 'Farcaster Frame',
      type: 'farcaster-frame',

      connect: doConnect as any,

      async disconnect() {
        // No-op for frame provider
      },

      getAccounts: doGetAccounts,

      async getChainId() {
        const provider = sdk.wallet.ethProvider
        if (!provider) return base.id

        const chainId = (await provider.request({
          method: 'eth_chainId',
        })) as string

        return parseInt(chainId, 16)
      },

      async getProvider() {
        return sdk.wallet.ethProvider as EIP1193Provider
      },

      async isAuthorized() {
        try {
          const accounts = await doGetAccounts()
          return accounts.length > 0
        } catch {
          return false
        }
      },

      onAccountsChanged(accounts: string[]) {
        config.emitter.emit('change', {
          accounts: accounts as `0x${string}`[],
        })
      },

      onChainChanged(chainId: string) {
        config.emitter.emit('change', { chainId: parseInt(chainId, 16) })
      },

      onDisconnect() {
        config.emitter.emit('disconnect')
      },
    }
  }) as CreateConnectorFn
}

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [farcasterFrame(), injected()],
  transports: {
    [base.id]: http(baseRpcUrl),
  },
})
