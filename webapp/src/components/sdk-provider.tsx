'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'

import { AuthContext } from '@/lib/auth-context'
import { getUserByFid } from '@/lib/neynar'
import type { FarcasterUser } from '@/lib/types'

export function SdkProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [fid, setFid] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    async function initializeSdk() {
      try {
        // Get SDK context
        const context = await sdk.context

        if (!mounted) return

        if (context && context.user) {
          const userFid = context.user.fid
          console.log('✓ Farcaster SDK initialized, FID:', userFid)
          setFid(userFid)

          // Fetch user profile from Neynar
          const userProfile = await getUserByFid(userFid)
          if (mounted && userProfile) {
            setUser(userProfile)
          }

          // Signal that the mini app is ready to display
          await sdk.actions.ready()
          console.log('✓ Mini app ready')
        } else {
          console.log('ℹ Running in standalone mode (no Farcaster context)')
        }
      } catch (err) {
        console.log('SDK init failed (expected in browser):', err)
      } finally {
        if (mounted) {
          setIsReady(true)
        }
      }
    }

    initializeSdk()

    return () => {
      mounted = false
    }
  }, [])

  // Show loading screen with BettingMutt
  if (!isReady) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center gap-4"
        style={{ backgroundColor: '#fefce8' }}
      >
        <img
          src="/img/bettingmutt.png"
          alt="WannaBet"
          className="h-32 w-32 animate-pulse"
        />
        <p className="animate-pulse text-sm" style={{ color: '#a3a3a3' }}>
          Loading WannaBet...
        </p>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        fid,
        isAuthenticated: !!fid,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
