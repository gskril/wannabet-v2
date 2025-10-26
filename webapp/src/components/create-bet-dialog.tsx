'use client'

import { Calendar, Loader2, Plus } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Address, decodeEventLog, parseUnits } from 'viem'
import {
  useAccount,
  useConnect,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi'
import {
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from 'wagmi/actions'

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
import { UserSearch } from '@/components/user-search'
import { resolveAddressFromFid } from '@/lib/address-resolver'
import { useAuth } from '@/lib/auth-context'
import {
  BETFACTORY_ABI,
  BETFACTORY_ADDRESS,
  ERC20_ABI,
  USDC_ADDRESS,
} from '@/lib/contracts'
import type { FarcasterUser } from '@/lib/types'
import { wagmiConfig } from '@/lib/wagmi-config'

/** -----------------------------
 * constants & types
 * ------------------------------ */
const BASE_CHAIN_ID = 8453 as const
type DateOption = '1day' | '7days' | '30days' | 'custom'
type SubmitPhase =
  | 'idle'
  | 'precheck'
  | 'predicting'
  | 'approving'
  | 'creating'
  | 'confirming'
  | 'verifying'
  | 'done'
type Step = 1 | 2 | 3 | 4 | 5

interface FormData {
  taker: string
  takerUser?: FarcasterUser
  judge: string
  judgeUser?: FarcasterUser
  amount: string
  expiresAt: string
  dateOption: DateOption | null
  description: string
}

interface UiError {
  title: string
  detail?: string
}

/** tiny helpers */
const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as Address
const isNonEmpty = (s?: string) => !!s && s.trim().length > 0
const fmtDate = (iso?: string) =>
  !iso
    ? ''
    : new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

/** centralize feature logging behind a flag */
const DEBUG = false
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[CreateBet]', ...args)
}

export function CreateBetDialog() {
  const { user: currentUser } = useAuth()

  /** dialog + wizard state */
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [uiError, setUiError] = useState<UiError | null>(null)

  /** result/derived state */
  const [createdBetAddress, setCreatedBetAddress] = useState<Address | null>(
    null
  )
  const [predictedBetAddress, setPredictedBetAddress] =
    useState<Address | null>(null)
  const [betCreationHash, setBetCreationHash] = useState<`0x${string}` | null>(
    null
  )
  const [phase, setPhase] = useState<SubmitPhase>('idle')

  /** form state */
  const [formData, setFormData] = useState<FormData>({
    taker: '',
    judge: '',
    amount: '',
    expiresAt: '',
    dateOption: null,
    description: '',
  })

  /** web3 hooks */
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const { writeContractAsync: approveWrite, isPending: isApprovingWrite } =
    useWriteContract()
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    chainId: BASE_CHAIN_ID, // <--- force to Base
    query: { enabled: isConnected && step === 5 },
  })

  /** mounted ref to avoid state updates after unmount */
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  /** open via #create hash */
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#create') {
        setOpen(true)
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )
      }
    }
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /** prefill description at entry to step 4 */
  useEffect(() => {
    if (step === 4 && !isNonEmpty(formData.description)) {
      const username = currentUser?.username || 'testuser'
      setFormData((prev) => ({
        ...prev,
        description: `${username} bets that `,
      }))
    }
  }, [step, currentUser, formData.description])

  /** simple wizard guards */
  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        // judge required
        return isNonEmpty(formData.judge)
      case 2: {
        const n = Number(formData.amount)
        return isFinite(n) && n > 0
      }
      case 3:
        return formData.dateOption !== null && isNonEmpty(formData.expiresAt)
      case 4: {
        const username = currentUser?.username || 'testuser'
        const prefill = `${username} bets that `
        return (formData.description || '').length > prefill.length
      }
      case 5:
        return true
      default:
        return false
    }
  }, [step, formData, currentUser])

  const DATE_PRESETS: { key: DateOption; label: string; days: number }[] =
    useMemo(
      () => [
        { key: '1day', label: 'Day', days: 1 },
        { key: '7days', label: 'Days', days: 7 },
        { key: '30days', label: 'Days', days: 30 },
      ],
      []
    )

  /** reset everything cleanly */
  const handleReset = useCallback(() => {
    setStep(1)
    setUiError(null)
    setFormData({
      taker: '',
      judge: '',
      amount: '',
      expiresAt: '',
      dateOption: null,
      description: '',
    })
    setCreatedBetAddress(null)
    setPredictedBetAddress(null)
    setBetCreationHash(null)
    setPhase('idle')
  }, [])

  /** step navigation */
  const handleNext = useCallback(() => {
    if (!canProceed || step >= 5) return
    setStep((s) => (s < 5 ? ((s + 1) as Step) : s))
  }, [canProceed, step])

  const handleBack = useCallback(() => {
    if (step <= 1) return
    setStep((s) => (s - 1) as Step)
  }, [step])

  /** date helpers */
  const handleDateSelect = (option: DateOption) => {
    const now = new Date()
    let expiryDate: Date | null = null

    if (option === '1day') {
      expiryDate = new Date(now)
      expiryDate.setDate(now.getDate() + 1)
    } else if (option === '7days') {
      expiryDate = new Date(now)
      expiryDate.setDate(now.getDate() + 7)
    } else if (option === '30days') {
      expiryDate = new Date(now)
      expiryDate.setDate(now.getDate() + 30)
    } else {
      setFormData((p) => ({ ...p, dateOption: option, expiresAt: '' }))
      return
    }

    setFormData((p) => ({
      ...p,
      dateOption: option,
      expiresAt: expiryDate.toISOString(),
    }))
  }

  const handleCustomDateChange = (dateString: string) => {
    if (dateString) {
      const d = new Date(dateString)
      d.setHours(23, 59, 59, 999)
      setFormData((p) => ({
        ...p,
        dateOption: 'custom',
        expiresAt: d.toISOString(),
      }))
    } else {
      setFormData((p) => ({ ...p, dateOption: 'custom', expiresAt: '' }))
    }
  }

  /** submission flow */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setUiError(null)

      if (!isConnected || !address) {
        setUiError({ title: 'Connect your wallet to continue.' })
        return
      }
      if (chain?.id !== BASE_CHAIN_ID) {
        try {
          setPhase('precheck')
          await switchChainAsync({ chainId: BASE_CHAIN_ID })
        } catch {
          setUiError({ title: 'Please switch to Base (8453) in your wallet.' })
          setPhase('idle')
          return
        }
      }

      try {
        setPhase('precheck')

        // validate amount & balance
        const amountNum = Number(formData.amount)
        if (!isFinite(amountNum) || amountNum <= 0) {
          throw new Error('Enter a valid USDC amount.')
        }
        const amountInUnits = parseUnits(formData.amount, 6)

        // resolve optional taker/judge
        const takerAddress: Address = formData.takerUser?.fid
          ? ((await resolveAddressFromFid(
              formData.takerUser.fid
            )) as Address) || ZERO_ADDR
          : ZERO_ADDR

        const judgeAddress: Address = formData.judgeUser?.fid
          ? ((await resolveAddressFromFid(
              formData.judgeUser.fid
            )) as Address) || ZERO_ADDR
          : ZERO_ADDR

        if (formData.judgeUser?.fid && judgeAddress === ZERO_ADDR) {
          throw new Error(
            'Could not resolve judge address. Ensure judge has a verified ETH address.'
          )
        }

        // compute timing windows
        const acceptBy = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        const expiresAtTs = Math.floor(
          new Date(formData.expiresAt).getTime() / 1000
        )
        const resolveBy = expiresAtTs + 90 * 24 * 60 * 60

        // predict address (source of truth for allowance + verification)
        setPhase('predicting')
        const predicted = (await readContract(wagmiConfig, {
          address: BETFACTORY_ADDRESS,
          abi: BETFACTORY_ABI,
          functionName: 'predictBetAddress',
          args: [
            address,
            takerAddress,
            USDC_ADDRESS,
            amountInUnits,
            amountInUnits,
            acceptBy,
            resolveBy,
          ],
          chainId: BASE_CHAIN_ID,
        })) as Address

        if (!mounted.current) return
        setPredictedBetAddress(predicted)
        log('predicted address:', predicted)

        // ensure allowance for predicted spender
        setPhase('approving')
        const currentAllowance = (await readContract(wagmiConfig, {
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, predicted],
          chainId: BASE_CHAIN_ID,
        })) as bigint

        if (currentAllowance < amountInUnits) {
          const approveHash = await approveWrite({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [predicted, amountInUnits],
            chainId: BASE_CHAIN_ID,
          })

          await waitForTransactionReceipt(wagmiConfig, {
            hash: approveHash,
            chainId: BASE_CHAIN_ID,
          })
        }

        if (!mounted.current) return

        // create bet
        setPhase('creating')
        const createHash = await writeContract(wagmiConfig, {
          address: BETFACTORY_ADDRESS,
          abi: BETFACTORY_ABI,
          functionName: 'createBet',
          args: [
            takerAddress,
            judgeAddress,
            USDC_ADDRESS,
            amountInUnits,
            amountInUnits,
            acceptBy,
            resolveBy,
            formData.description,
          ],
          chainId: BASE_CHAIN_ID,
        })
        setBetCreationHash(createHash)

        // confirm bet creation
        setPhase('confirming')
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: createHash,
          chainId: BASE_CHAIN_ID,
        })

        // extract emitted bet address
        setPhase('verifying')
        const factoryLog = receipt.logs.find(
          (l) => l.address.toLowerCase() === BETFACTORY_ADDRESS.toLowerCase()
        )
        if (!factoryLog) throw new Error('No BetFactory log found.')

        const decoded = decodeEventLog({
          abi: BETFACTORY_ABI,
          data: factoryLog.data,
          topics: factoryLog.topics,
        })

        if (decoded.eventName !== 'BetCreated')
          throw new Error('Unexpected event emitted.')

        const emittedBet = decoded.args.bet as Address
        setCreatedBetAddress(emittedBet)

        // hard verify against predicted
        if (emittedBet.toLowerCase() !== predicted.toLowerCase()) {
          setUiError({
            title: 'Address mismatch',
            detail: `Predicted ${predicted} but emitted ${emittedBet}. Please contact support.`,
          })
          setPhase('idle')
          return
        }

        setPhase('done')
        setStep(5)
      } catch (err: unknown) {
        if (!mounted.current) return
        setPhase('idle')
        setUiError({
          title: 'Transaction failed',
          detail:
            (err as { shortMessage?: string; message?: string })
              ?.shortMessage ||
            (err as { shortMessage?: string; message?: string })?.message ||
            'Unknown error',
        })
      }
    },
    [
      isConnected,
      address,
      chain?.id,
      switchChainAsync,
      formData.amount,
      formData.expiresAt,
      formData.description,
      formData.judgeUser?.fid,
      formData.takerUser?.fid,
      approveWrite,
    ]
  )

  /** derived ui booleans */
  const isBusy =
    phase === 'precheck' ||
    phase === 'predicting' ||
    phase === 'approving' ||
    phase === 'creating' ||
    phase === 'confirming' ||
    phase === 'verifying' ||
    isSwitchingChain ||
    isApprovingWrite

  const submitCta = (() => {
    if (isSwitchingChain) return 'Switching Network...'
    switch (phase) {
      case 'precheck':
        return 'Checking...'
      case 'predicting':
        return 'Predicting Address...'
      case 'approving':
        return 'Approving USDC...'
      case 'creating':
        return 'Creating Bet...'
      case 'confirming':
        return 'Confirming...'
      case 'verifying':
        return 'Verifying...'
      default:
        return chain?.id !== BASE_CHAIN_ID ? 'Wrong Network' : 'Create Bet'
    }
  })()

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) handleReset()
      }}
    >
      <DrawerTrigger asChild>
        <Button
          size="lg"
          className="hidden sm:fixed sm:bottom-4 sm:right-4 sm:z-50 sm:flex sm:h-auto sm:w-auto sm:items-center sm:gap-2 sm:rounded-md sm:px-6 sm:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Create Bet</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-md overflow-y-auto">
        <DrawerHeader className="pb-3">
          <DrawerTitle>Create a New Bet</DrawerTitle>
        </DrawerHeader>

        {/* progress */}
        <div className="mb-4 flex items-center justify-center gap-2 px-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-all ${
                s === step
                  ? 'bg-primary'
                  : s < step
                    ? 'bg-primary/50'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-8 sm:pb-6">
          {/* connect */}
          {!isConnected && (
            <div className="space-y-4 text-center">
              <Label className="text-lg font-semibold">Connect Wallet</Label>
              <p className="text-muted-foreground text-sm">
                Connect your wallet to create a bet.
              </p>
              <Button
                type="button"
                onClick={() => {
                  const injected = connectors.find((c) => c.type === 'injected')
                  if (injected) connect({ connector: injected })
                }}
                className="w-full"
              >
                Connect Wallet
              </Button>
            </div>
          )}

          {/* step 1: participants */}
          {isConnected && step === 1 && (
            <div className="space-y-4">
              <UserSearch
                label="Who are you betting?"
                placeholder="@username"
                helperText="Leave empty to allow anyone to accept"
                value={formData.taker}
                onChange={(value, user) =>
                  setFormData((p) => ({ ...p, taker: value, takerUser: user }))
                }
              />
              <UserSearch
                label="Who should judge?"
                placeholder="@username"
                helperText="Pick someone both parties trust to decide the outcome"
                required
                value={formData.judge}
                onChange={(value, user) =>
                  setFormData((p) => ({ ...p, judge: value, judgeUser: user }))
                }
              />
            </div>
          )}

          {/* step 2: amount */}
          {isConnected && step === 2 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">How much USDC?</Label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 5, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, amount: String(preset) }))
                    }
                    className={`flex h-20 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                      formData.amount === String(preset)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-primary/10 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl font-bold">{preset}</span>
                    <span className="text-xs">USDC</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
                  <Image
                    src="/img/usdc.png"
                    alt="USDC"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Custom amount"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                  className="h-14 pl-14 pr-16 text-xl font-semibold"
                />
                <span className="text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium">
                  USDC
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Both you and your opponent will put up this amount.
              </p>
            </div>
          )}

          {/* step 3: end date */}
          {isConnected && step === 3 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                When does the bet end?
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {DATE_PRESETS.map(({ key, label, days }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDateSelect(key)}
                    className={`flex h-24 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                      formData.dateOption === key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-primary/10 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl font-bold">{days}</span>
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[type="date"]')
                    ?.showPicker?.()
                }
              >
                <Input
                  type="date"
                  value={
                    formData.expiresAt
                      ? new Date(formData.expiresAt).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`h-12 cursor-pointer pr-10 text-base [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${
                    formData.expiresAt ? 'border-primary bg-primary/10' : ''
                  }`}
                />
                <Calendar className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* step 4: description */}
          {isConnected && step === 4 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                What&apos;s the bet?
              </Label>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Complete the sentence:
                </p>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  required
                  autoFocus
                  className="h-20 text-lg"
                />
                {formData.expiresAt && (
                  <p className="text-muted-foreground text-sm">
                    Bet ends:{' '}
                    <span className="font-medium">
                      {fmtDate(formData.expiresAt)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* step 5: review + submit */}
          {isConnected && step === 5 && (
            <div className="space-y-4">
              {chain?.id !== BASE_CHAIN_ID && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Wrong Network</p>
                      <p className="text-muted-foreground text-xs">
                        You&apos;re on {chain?.name || 'Unknown'}. Switch to
                        Base to create a bet.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={async () =>
                        await switchChainAsync({ chainId: BASE_CHAIN_ID })
                      }
                      disabled={isSwitchingChain}
                    >
                      {isSwitchingChain ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Switching...
                        </>
                      ) : (
                        'Switch to Base'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* success block */}
              {phase === 'done' && createdBetAddress ? (
                <div className="space-y-4 text-center">
                  <div className="text-4xl">🎉</div>
                  <Label className="text-lg font-semibold">
                    Bet Created Successfully!
                  </Label>

                  <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-sm">
                    <p className="text-muted-foreground text-xs">
                      Predicted Address
                    </p>
                    <p className="break-all font-mono text-xs">
                      {predictedBetAddress}
                    </p>
                  </div>

                  <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-sm">
                    <p className="text-muted-foreground text-xs">
                      Emitted Address
                    </p>
                    <p className="break-all font-mono text-xs">
                      {createdBetAddress}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      asChild
                      variant="default"
                      className="w-full"
                      size="lg"
                    >
                      <a
                        href={`/bet/${createdBetAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Bet
                      </a>
                    </Button>
                    {betCreationHash && (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <a
                          href={`https://basescan.org/tx/${betCreationHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on BaseScan
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleReset()
                        setOpen(false)
                      }}
                      className="w-full"
                    >
                      Create Another
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Label className="text-base font-semibold">
                    Review Your Bet
                  </Label>
                  <div className="space-y-2">
                    <div className="bg-card space-y-2 rounded-lg border p-3">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Opponent
                        </p>
                        <p className="text-sm font-medium">
                          {formData.takerUser
                            ? `@${formData.takerUser.username}`
                            : 'Open to anyone'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Judge</p>
                        <p className="text-sm font-medium">
                          {formData.judgeUser
                            ? `@${formData.judgeUser.username}`
                            : formData.judge}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Amount</p>
                        <p className="text-sm font-medium">
                          {formData.amount} USDC (each)
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          End Date
                        </p>
                        <p className="text-sm font-medium">
                          {fmtDate(formData.expiresAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Bet Description
                        </p>
                        <p className="text-sm font-medium">
                          {formData.description}
                        </p>
                      </div>
                      {predictedBetAddress && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Predicted Address
                          </p>
                          <p className="break-all font-mono text-xs">
                            {predictedBetAddress}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* inline error */}
                  {uiError && (
                    <div className="border-destructive/30 bg-destructive/10 rounded-md border p-2">
                      <p className="text-destructive-foreground text-sm font-semibold">
                        {uiError.title}
                      </p>
                      {uiError.detail && (
                        <p className="text-destructive-foreground/80 text-xs">
                          {uiError.detail}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* nav */}
          {isConnected && (
            <div className="flex gap-3 pb-2 pt-4">
              {step > 1 && phase !== 'done' && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 text-base"
                  onClick={handleBack}
                  disabled={isBusy}
                >
                  Back
                </Button>
              )}

              {step < 5 ? (
                <Button
                  type="button"
                  className="h-12 flex-1 text-base"
                  onClick={handleNext}
                  disabled={!canProceed || isBusy}
                >
                  Next
                </Button>
              ) : phase !== 'done' ? (
                <Button
                  type="submit"
                  className="h-12 flex-1 text-base"
                  disabled={
                    !canProceed || chain?.id !== BASE_CHAIN_ID || isBusy
                  }
                >
                  {isBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {submitCta}
                </Button>
              ) : null}
            </div>
          )}
        </form>
      </DrawerContent>
    </Drawer>
  )
}
