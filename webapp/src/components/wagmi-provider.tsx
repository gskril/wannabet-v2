'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { WagmiProvider as WagmiProviderBase, useConnect, useAccount } from 'wagmi'

import { wagmiConfig } from '@/lib/wagmi-config'

// Component that auto-connects to Farcaster wallet when in MiniApp context
function FarcasterAutoConnect() {
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()
  const [hasAttempted, setHasAttempted] = useState(false)

  useEffect(() => {
    // Only attempt once and only if not already connected
    if (hasAttempted || isConnected) return

    const autoConnect = async () => {
      setHasAttempted(true)

      // Check if we're in a MiniApp context by checking if the SDK has a provider
      try {
        const provider = sdk.wallet.ethProvider
        if (provider) {
          // Try to get accounts to see if already authorized
          const accounts = await provider.request({ method: 'eth_accounts' })
          if (Array.isArray(accounts) && accounts.length > 0) {
            // Find the farcaster-frame connector and connect
            const frameConnector = connectors.find(
              (c) => c.id === 'farcaster-frame'
            )
            if (frameConnector) {
              connect({ connector: frameConnector })
            }
          }
        }
      } catch (err) {
        // Not in MiniApp context or provider not available - that's fine
        console.debug('Farcaster auto-connect skipped:', err)
      }
    }

    // Small delay to ensure SDK is initialized
    const timer = setTimeout(autoConnect, 100)
    return () => clearTimeout(timer)
  }, [connect, connectors, isConnected, hasAttempted])

  return null
}

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reduce aggressive polling to avoid MetaMask circuit breaker
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
            staleTime: 30000, // 30 seconds
          },
        },
      })
  )

  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FarcasterAutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  )
}
