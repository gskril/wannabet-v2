'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'

export function SdkProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initSdk = async () => {
      try {
        // Check if we're in a Farcaster client
        const context = sdk.context
        console.log('Farcaster SDK Context:', context)

        // Only call ready() if we're actually in a Farcaster client
        if (context.client) {
          await sdk.actions.ready()
          console.log('✓ Farcaster SDK initialized')
        } else {
          console.log('ℹ Running in standalone mode (not in Farcaster)')
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error)
      } finally {
        // Always set as ready (works standalone too)
        setIsReady(true)
      }
    }

    // Add a small timeout to prevent flash
    const timer = setTimeout(initSdk, 100)
    return () => clearTimeout(timer)
  }, [])

  // Show a minimal loading state while SDK initializes
  if (!isReady) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
