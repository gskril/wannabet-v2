'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import type { FarcasterUser } from 'indexer/types'
import { Info, Loader2, Plus, Share2 } from 'lucide-react'
import Image from 'next/image'
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'

import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UsdcBalance } from '@/components/usdc-balance'
import { UserSearch } from '@/components/user-search'
import { useMiniApp } from '@/components/sdk-provider'
import { useCreateBet } from '@/hooks/useCreateBet'
import { useNotifications } from '@/hooks/useNotifications'

type SubmitPhase = 'idle' | 'approving' | 'creating' | 'done' | 'error'

interface FormData {
  taker: string
  takerUser?: FarcasterUser
  judge: string
  judgeUser?: FarcasterUser
  amount: string
  expiresAt: string
  description: string
}

const INITIAL_FORM_DATA: FormData = {
  taker: '',
  judge: '',
  amount: '',
  expiresAt: '',
  description: '',
}

export function CreateBetDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [phase, setPhase] = useState<SubmitPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')
  const [showJudgeTip, setShowJudgeTip] = useState(false)

  const { address, isConnected } = useAccount()
  const { isMiniApp } = useMiniApp()
  const {
    submit: submitCreateBet,
    reset: resetCreateBet,
    phase: createPhase,
    error: createError,
    betAddress,
  } = useCreateBet()
  const { notifyBetCreated } = useNotifications()

  // Sync hook phase with local phase and send notification on success
  useEffect(() => {
    if (createPhase === 'approving') setPhase('approving')
    else if (createPhase === 'creating') setPhase('creating')
    else if (createPhase === 'success') {
      setPhase('done')
      // Send notification to taker
      if (betAddress && formData.takerUser?.fid) {
        notifyBetCreated({
          address: betAddress,
          description: formData.description,
          amount: formData.amount,
          maker: { fid: null, username: 'Someone' }, // We don't have maker's username here
          taker: { fid: formData.takerUser.fid },
        })
      }
    } else if (createPhase === 'error') {
      setPhase('error')
      setErrorMessage(createError)
    }
  }, [createPhase, createError, betAddress, formData, notifyBetCreated])

  // Open dialog via #create hash
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#create') {
        setOpen(true)
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )
      }
    }
    window.addEventListener('hashchange', handleHash)
    handleHash()
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Form validation
  const isFormValid = useMemo(() => {
    const hasOpponent = formData.takerUser?.address
    const hasDescription = formData.description.trim().length > 5
    const hasValidDate = formData.expiresAt.length > 0
    const hasValidAmount = Number(formData.amount) > 0
    const hasJudge = formData.judgeUser?.address

    return (
      hasOpponent &&
      hasDescription &&
      hasValidDate &&
      hasValidAmount &&
      hasJudge &&
      isConnected
    )
  }, [formData, isConnected])

  const isSubmitting = phase === 'approving' || phase === 'creating'

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setPhase('idle')
    setErrorMessage(null)
    setShareStatus('idle')
    resetCreateBet()
  }, [resetCreateBet])

  // Share bet functionality
  const handleShare = useCallback(async () => {
    if (!betAddress) return
    const betUrl = `https://farcaster.xyz/miniapps/E7dxAafMr7wy/wannabet/bet/${betAddress}`

    if (isMiniApp) {
      sdk.actions.composeCast({
        text: `I just created a bet on WannaBet!\n\n"${formData.description}"\n\n${formData.amount} USDC each`,
        embeds: [betUrl],
      })
      return
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(betUrl)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [betAddress, isMiniApp, formData.description, formData.amount])

  // Update form field
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Submit bet creation
  const handleSubmit = useCallback(async () => {
    if (!formData.takerUser?.address || !formData.judgeUser?.address) {
      setErrorMessage('Please select valid users for opponent and judge')
      setPhase('error')
      return
    }

    // Calculate timestamps
    const now = Math.floor(Date.now() / 1000)
    const endsBy = Math.floor(new Date(formData.expiresAt).getTime() / 1000)

    // Validate that endsBy is in the future
    if (endsBy <= now) {
      setErrorMessage('End date must be in the future')
      setPhase('error')
      return
    }

    // acceptBy must be before endsBy - set to min(7 days from now, endsBy - 1 hour)
    // with a minimum of 1 hour from now
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60
    const oneHourBeforeEnd = endsBy - 60 * 60
    const oneHourFromNow = now + 60 * 60

    const acceptBy = Math.max(
      oneHourFromNow,
      Math.min(sevenDaysFromNow, oneHourBeforeEnd)
    )

    await submitCreateBet({
      taker: formData.takerUser.address as Address,
      judge: formData.judgeUser.address as Address,
      makerStake: formData.amount,
      takerStake: formData.amount, // Same stake for both sides
      acceptBy,
      endsBy,
      description: formData.description,
    })
  }, [formData, submitCreateBet])

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) handleReset()
      }}
      repositionInputs={false}
    >
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="bg-wb-coral hover:bg-wb-coral/90 fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full text-white shadow-lg [&_svg]:size-8"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="bg-wb-cream max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-wb-brown">Create New Bet</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 pb-6">
          {/* Success State */}
          {phase === 'done' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">🎉</div>
              <p className="text-wb-brown text-lg font-semibold">
                Bet Created Successfully!
              </p>
              <p className="text-wb-taupe text-sm">
                Your bet has been created on Base. Waiting for{' '}
                {formData.takerUser?.username || 'opponent'} to accept.
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                  size="lg"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {isMiniApp ? 'Share on Farcaster' : shareStatus === 'copied' ? 'Copied!' : 'Share Bet'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setOpen(false)
                    handleReset()
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {phase === 'error' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">❌</div>
              <p className="text-wb-brown text-lg font-semibold">
                Failed to Create Bet
              </p>
              <p className="text-wb-taupe text-sm">{errorMessage}</p>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setPhase('idle')
                    setErrorMessage(null)
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Form */}
          {phase !== 'done' && phase !== 'error' && (
            <div className="space-y-3">
              {/* Opponent */}
              <UserSearch
                label="Who I'm betting"
                value={formData.taker}
                required
                onChange={(value, user) => {
                  updateField('taker', value)
                  updateField('takerUser', user)
                }}
                labelClassName="text-wb-brown text-sm"
                inputClassName="bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
              />

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-wb-brown text-sm">
                  I am betting that...
                </Label>
                <Textarea
                  placeholder="e.g., the Knicks will win the championship"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe min-h-[60px] resize-none"
                />
              </div>

              {/* End Date and Amount - Side by side */}
              <div className="grid grid-cols-2 items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-wb-brown text-sm">When it ends</Label>
                  <DatePicker
                    value={formData.expiresAt}
                    onChange={(date) => updateField('expiresAt', date)}
                    minDate={new Date()}
                    placeholder="Select date"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-wb-brown text-sm">
                    How much (each)
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      placeholder="100"
                      value={formData.amount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          updateField('amount', val)
                        }
                      }}
                      className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Image
                        src="/img/usdc.png"
                        alt="USDC"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <UsdcBalance />
              </div>

              {/* Judge */}
              <UserSearch
                label={
                  <span className="flex items-center gap-1">
                    Who will judge
                    <button
                      type="button"
                      className="relative"
                      onClick={(e) => { e.preventDefault(); setShowJudgeTip((v) => !v) }}
                    >
                      <Info className="h-3.5 w-3.5 text-wb-taupe" />
                      {showJudgeTip && (
                        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-wb-brown px-2 py-1 text-xs text-white">
                          Want to use an agent as your judge? Use @agentjudge!
                        </span>
                      )}
                    </button>
                  </span>
                }
                value={formData.judge}
                required
                onChange={(value, user) => {
                  updateField('judge', value)
                  updateField('judgeUser', user)
                }}
                labelClassName="text-wb-brown text-sm"
                inputClassName="bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
              />

              {/* Submit */}
              <Button
                className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {phase === 'approving'
                  ? 'Approving USDC...'
                  : phase === 'creating'
                    ? 'Creating Bet...'
                    : !isConnected
                      ? 'Connect Wallet'
                      : 'Create Bet'}
              </Button>

              <p className="text-wb-taupe text-center text-xs">
                Bet offers expire 7 days after creation
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
