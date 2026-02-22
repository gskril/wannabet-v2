'use client'

import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type VerifyResponse = {
  ok?: boolean
  link?: {
    walletAddress?: string
    linkedAt?: string
  }
  error?: string
}

function LinkWalletFlow({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy()
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [status, setStatus] = useState<
    'loading' | 'needs_challenge' | 'needs_auth' | 'verifying' | 'linked' | 'error'
  >('loading')
  const [message, setMessage] = useState<string>('')
  const [linkedWalletAddress, setLinkedWalletAddress] = useState<string | null>(null)
  const hasAutoAttemptedRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('challengeId')
    setChallengeId(id)

    if (!id) {
      setStatus('needs_challenge')
      setMessage(
        'This page is always live. On X, mention @heywannabet with "link wallet" to get a secure link.'
      )
      return
    }

    setStatus('loading')
  }, [])

  const verify = async () => {
    if (!challengeId) {
      setStatus('error')
      setMessage('Missing challengeId in URL. Request a fresh link from X.')
      return
    }

    setStatus('verifying')
    setMessage('Verifying wallet link...')

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setStatus('needs_auth')
        setMessage('Sign in with Privy to continue wallet linking.')
        return
      }

      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/wallet/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          privyAccessToken: accessToken,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as VerifyResponse

      if (!response.ok || !data.ok) {
        const errorMessage =
          data.error ?? `Wallet link verification failed (${response.status}).`
        throw new Error(errorMessage)
      }

      setLinkedWalletAddress(data.link?.walletAddress ?? null)
      setStatus('linked')
      setMessage(
        'Wallet linked successfully. Return to X and repost your command to continue.'
      )
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Wallet link verification failed.'
      if (/invalid|expired/i.test(detail) && /challengeid/i.test(detail)) {
        setStatus('needs_challenge')
        setMessage(
          'This secure link expired. On X, mention @heywannabet with "link wallet" for a fresh link.'
        )
      } else {
        setStatus('error')
        setMessage(detail)
      }
    }
  }

  useEffect(() => {
    if (!challengeId) {
      return
    }

    if (!ready) {
      setStatus('loading')
      return
    }

    if (!authenticated) {
      setStatus('needs_auth')
      setMessage('Sign in with Privy to continue wallet linking.')
      return
    }

    if (!hasAutoAttemptedRef.current) {
      hasAutoAttemptedRef.current = true
      void verify()
    }
  }, [ready, authenticated, challengeId])

  const primaryAction = useMemo(() => {
    if (status === 'needs_challenge') {
      return (
        <Button asChild className="w-full">
          <a
            href="https://x.com/intent/tweet?text=%40heywannabet%20link%20wallet"
            target="_blank"
            rel="noreferrer"
          >
            Request Link on X
          </a>
        </Button>
      )
    }

    if (status === 'needs_auth') {
      return (
        <Button onClick={login} className="w-full">
          Continue with Privy
        </Button>
      )
    }

    if (status === 'error' && authenticated) {
      return (
        <Button onClick={() => void verify()} className="w-full">
          Retry Verification
        </Button>
      )
    }

    if (status === 'linked') {
      return (
        <Button onClick={logout} variant="outline" className="w-full">
          Disconnect Session
        </Button>
      )
    }

    return null
  }, [status, authenticated, login, logout])

  return (
    <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Link Wallet</CardTitle>
          <CardDescription>
            Connect your Privy wallet to your X account for @heywannabet commands.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 text-sm">
            <div className="font-medium">Status</div>
            <p className="mt-1 text-muted-foreground">{message || 'Waiting...'}</p>
          </div>

          {challengeId ? (
            <div className="rounded-lg border p-4 text-sm">
              <div className="font-medium">Challenge ID</div>
              <p className="mt-1 break-all text-muted-foreground">{challengeId}</p>
            </div>
          ) : null}

          {user?.id ? (
            <div className="rounded-lg border p-4 text-sm">
              <div className="font-medium">Privy User</div>
              <p className="mt-1 break-all text-muted-foreground">{user.id}</p>
            </div>
          ) : null}

          {linkedWalletAddress ? (
            <div className="rounded-lg border p-4 text-sm">
              <div className="font-medium">Linked Wallet</div>
              <p className="mt-1 break-all text-muted-foreground">{linkedWalletAddress}</p>
            </div>
          ) : null}

          {status === 'verifying' ? (
            <Button disabled className="w-full">
              Verifying...
            </Button>
          ) : (
            primaryAction
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default function LinkWalletPage() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_X_BOT_API_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL

  if (!appId || !apiBaseUrl) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-xl items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Link Wallet</CardTitle>
            <CardDescription>Configuration is incomplete.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set NEXT_PUBLIC_PRIVY_APP_ID and NEXT_PUBLIC_BASE_URL (or
              NEXT_PUBLIC_X_BOT_API_BASE_URL) in the webapp environment.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <PrivyProvider
      appId={appId}
      {...(clientId ? { clientId } : {})}
    >
      <LinkWalletFlow apiBaseUrl={apiBaseUrl} />
    </PrivyProvider>
  )
}
