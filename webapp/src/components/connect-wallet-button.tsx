'use client'

import { Loader2, Wallet } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

export function ConnectWalletButton() {
  const { isAuthenticated } = useAuth()
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  // Hide button on Farcaster - users are already authenticated via FID
  if (isAuthenticated) {
    return null
  }

  if (isConnecting || isPending) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={() => disconnect()}
        className="font-mono"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    )
  }

  return (
    <Button
      onClick={() => {
        const injectedConnector = connectors.find((c) => c.type === 'injected')
        if (injectedConnector) {
          connect({ connector: injectedConnector })
        }
      }}
      variant="outline"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
