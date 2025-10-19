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
        console.log('🔄 Initializing Farcaster SDK...')

        // Get SDK context
        const context = await sdk.context
        console.log('📦 SDK Context received:', context)

        if (!mounted) return

        if (context && context.user) {
          const userFid = context.user.fid
          console.log('✓ Farcaster SDK initialized, FID:', userFid)
          console.log('👤 User object from SDK:', context.user)
          setFid(userFid)

          // Fetch user profile from Neynar
          console.log('🔍 Fetching user profile from Neynar for FID:', userFid)
          const userProfile = await getUserByFid(userFid)
          console.log('📥 Neynar profile received:', userProfile)

          if (mounted && userProfile) {
            setUser(userProfile)
            console.log('✅ User profile set in state')
          } else {
            console.warn('⚠️ No user profile received from Neynar')
          }

          // Signal that the mini app is ready to display
          await sdk.actions.ready()
          console.log('✓ Mini app ready signal sent')
        } else {
          console.log('ℹ Running in standalone mode (no Farcaster context)')
          console.log('  Context:', context)
          console.log('  Context.user:', context?.user)
        }
      } catch (err) {
        console.error('❌ SDK init failed:', err)
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
      {/* Debug indicator - remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 left-0 z-50 bg-black/80 p-2 text-xs text-white">
          {fid
            ? `✅ Authenticated: FID ${fid} (${user?.username || 'loading...'})`
            : '❌ Not authenticated'}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}
