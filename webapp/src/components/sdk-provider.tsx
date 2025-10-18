'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'

export function SdkProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initSdk = async () => {
      const startTime = Date.now()

      try {
        // Set a max timeout for SDK initialization
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            console.log('⏱️ SDK timeout - loading app in standalone mode')
            resolve({ client: null })
          }, 1000)
        })

        // Race between SDK context and timeout
        const context = await Promise.race([sdk.context, timeoutPromise])
        console.log('Farcaster SDK Context:', context)

        // Only call ready() if we're actually in a Farcaster client
        if (context && (context as any).client) {
          await sdk.actions.ready()
          console.log('✓ Farcaster SDK initialized')
        } else {
          console.log('ℹ Running in standalone mode (not in Farcaster)')
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error)
      } finally {
        // Ensure minimum 1 second display time for loading screen
        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, 1000 - elapsedTime)

        setTimeout(() => {
          setIsReady(true)
        }, remainingTime)
      }
    }

    initSdk()
  }, [])

  // Show a minimal loading state while SDK initializes
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
