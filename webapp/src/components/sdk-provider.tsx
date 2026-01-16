'use client'

import type { Context as MiniAppContext } from '@farcaster/miniapp-core'
import { type ReadyOptions, sdk } from '@farcaster/miniapp-sdk'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface MiniAppProviderProps extends React.PropsWithChildren {
  config?: ReadyOptions
}

type UserContext = MiniAppContext.UserContext

type MiniAppState = {
  user: UserContext | undefined
  notificationsEnabled: boolean
}

const Context = createContext<MiniAppState>({ user: undefined, notificationsEnabled: false })

export function SdkProvider({ children, config }: MiniAppProviderProps) {
  const [isFrameSDKLoaded, setIsFrameSDKLoaded] = useState(false)
  const [state, setState] = useState<MiniAppState>({ user: undefined, notificationsEnabled: false })

  useEffect(() => {
    const load = async () => {
      await sdk.actions.ready(config)
      const ctx = await sdk.context
      setState({
        user: ctx?.user || undefined,
        // notificationDetails exists only if user has enabled notifications
        notificationsEnabled: !!ctx?.client?.notificationDetails,
      })
    }

    if (sdk && !isFrameSDKLoaded) {
      setIsFrameSDKLoaded(true)
      load()
    }
  }, [isFrameSDKLoaded])

  return (
    <Context.Provider value={state}>
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed right-0 top-0 z-50 bg-black/80 p-2 text-xs text-white">
          {state.user?.fid
            ? `✅ MiniApp: FID ${state.user.fid} | Notifs: ${state.notificationsEnabled ? 'ON' : 'OFF'}`
            : '❌ Not in MiniApp'}
        </div>
      )}

      {children}
    </Context.Provider>
  )
}

export function useMiniApp() {
  const state = useContext(Context)

  const enableNotifications = useCallback(async () => {
    try {
      const result = await sdk.actions.addFrame()
      // If notificationDetails exists, notifications were enabled
      if (result.notificationDetails) {
        return { success: true, enabled: true }
      }
      // Miniapp was added but notifications were not enabled
      return { success: true, enabled: false }
    } catch (error) {
      console.error('[MiniApp] Failed to enable notifications:', error)
      return { success: false, enabled: false }
    }
  }, [])

  return {
    isMiniApp: !!state.user,
    miniAppUser: state.user,
    notificationsEnabled: state.notificationsEnabled,
    enableNotifications,
  }
}
