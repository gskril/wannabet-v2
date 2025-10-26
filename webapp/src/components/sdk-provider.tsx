'use client'

import type { Context as MiniAppContext } from '@farcaster/miniapp-core'
import { type ReadyOptions, sdk } from '@farcaster/miniapp-sdk'
import { createContext, useContext, useEffect, useState } from 'react'

interface MiniAppProviderProps extends React.PropsWithChildren {
  config?: ReadyOptions
}

type UserContext = MiniAppContext.UserContext

const Context = createContext<UserContext | undefined>(undefined)

export function SdkProvider({ children, config }: MiniAppProviderProps) {
  const [isFrameSDKLoaded, setIsFrameSDKLoaded] = useState(false)
  const [context, setContext] = useState<UserContext>()

  useEffect(() => {
    const load = async () => {
      await sdk.actions.ready(config)
      setContext((await sdk.context).user)
    }

    if (sdk && !isFrameSDKLoaded) {
      setIsFrameSDKLoaded(true)
      load()
    }
  }, [isFrameSDKLoaded])

  return (
    <Context.Provider value={context}>
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed right-0 top-0 z-50 bg-black/80 p-2 text-xs text-white">
          {context?.fid
            ? `✅ Viewing in MiniApp: FID ${context.fid} (${context.username || 'loading...'})`
            : '❌ Not in MiniApp'}
        </div>
      )}

      {children}
    </Context.Provider>
  )
}

export function useMiniApp() {
  const context = useContext(Context)
  return { isMiniApp: !!context, miniAppUser: context }
}
