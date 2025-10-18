'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'

export function SdkProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // ALWAYS show app after 1 second, no matter what
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 1000)

    // Try to init SDK in parallel (best effort, non-blocking)
    sdk.context
      .then((context) => {
        if (context && context.client) {
          sdk.actions.ready()
          console.log('✓ Farcaster SDK initialized')
        } else {
          console.log('ℹ Running in standalone mode')
        }
      })
      .catch((err) => {
        console.log('SDK init failed (expected in browser):', err)
      })

    return () => clearTimeout(timer)
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

  return <>{children}</>
}
