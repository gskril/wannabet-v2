'use client'

import { Loader2, Wallet } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useFarcasterProfile } from '@/hooks/useFarcasterProfile'
import { getUsername, shortenAddress } from '@/lib/utils'

import { useMiniApp } from './sdk-provider'

export function ConnectWalletButton() {
  const { isMiniApp } = useMiniApp()
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: farcasterProfile } = useFarcasterProfile(address)

  // Hide button on Farcaster - users are already authenticated via FID
  if (isMiniApp) {
    return null
  }

  if (isConnecting || isPending) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
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
        <Wallet className="h-4 w-4" />
        {farcasterProfile
          ? `@${getUsername(farcasterProfile)}`
          : shortenAddress(address)}
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
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
