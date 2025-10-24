'use client'

import { Calendar, Loader2, Plus } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { type Address, decodeEventLog, parseUnits } from 'viem'
import {
  useAccount,
  useConnect,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { readContract } from 'wagmi/actions'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

type DateOption = '1day' | '7days' | '30days' | 'custom'

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

export function CreateBetDialog() {
  const { user: currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    taker: '',
    judge: '',
    amount: '',
    expiresAt: '',
    dateOption: null,
    description: '',
  })
  const [createdBetAddress, setCreatedBetAddress] = useState<Address | null>(
    null
  )
  const [predictedBetAddress, setPredictedBetAddress] =
    useState<Address | null>(null)

  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  // USDC approval hooks
  const {
    data: approvalHash,
    writeContract: approveUsdc,
    isPending: isApproving,
    isSuccess: approvalWritten,
    reset: resetApproval,
  } = useWriteContract()

  const { isSuccess: approvalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
    query: {
      enabled: !!approvalHash, // Only watch when there's a hash
    },
  })

  // Bet creation hooks
  const {
    data: betCreationHash,
    writeContract: createBet,
    isPending: isCreatingBet,
    isSuccess: betCreationWritten,
    error: betCreationError,
    reset: resetBetCreation,
  } = useWriteContract()

  const {
    data: betCreationReceipt,
    isSuccess: betCreationConfirmed,
    isLoading: isWaitingForBetCreation,
  } = useWaitForTransactionReceipt({
    hash: betCreationHash,
    query: {
      enabled: !!betCreationHash, // Only watch when there's a hash
    },
  })

  // Check USDC allowance - only when on step 5
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, BETFACTORY_ADDRESS] : undefined,
    query: {
      enabled: isConnected && step === 5, // Auto-fetch only on step 5
      refetchInterval: false, // Don't auto-refetch
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  })

  const DATE_PRESETS: { key: DateOption; label: string; days: number }[] = [
    { key: '1day', label: 'Day', days: 1 },
    { key: '7days', label: 'Days', days: 7 },
    { key: '30days', label: 'Days', days: 30 },
  ]

  // Allow opening via #create hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#create') {
        setOpen(true)
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Prefill description when entering step 4
  useEffect(() => {
    if (step === 4 && !formData.description) {
      const username = currentUser?.username || 'testuser'
      setFormData((prev) => ({
        ...prev,
        description: `${username} bets that `,
      }))
    }
  }, [step, currentUser, formData.description])

  // When approval is confirmed, automatically create bet
  useEffect(() => {
    if (approvalConfirmed && step === 5 && address && predictedBetAddress) {
      refetchAllowance().then(async () => {
        // Now that allowance is updated, proceed with bet creation
        const amountInUnits = parseUnits(formData.amount, 6)

        // Resolve addresses from Farcaster users (must match prediction)
        const takerAddress: Address = formData.takerUser?.fid
          ? (await resolveAddressFromFid(formData.takerUser.fid)) ||
            ('0x0000000000000000000000000000000000000000' as Address)
          : ('0x0000000000000000000000000000000000000000' as Address)

        const judgeAddress: Address = formData.judgeUser?.fid
          ? (await resolveAddressFromFid(formData.judgeUser.fid)) ||
            ('0x0000000000000000000000000000000000000000' as Address)
          : ('0x0000000000000000000000000000000000000000' as Address)

        // Calculate timestamps (must match prediction)
        const acceptByTimestamp =
          Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        const expiresAtTimestamp = Math.floor(
          new Date(formData.expiresAt).getTime() / 1000
        )
        const resolveByTimestamp = expiresAtTimestamp + 90 * 24 * 60 * 60

        createBet({
          address: BETFACTORY_ADDRESS,
          abi: BETFACTORY_ABI,
          functionName: 'createBet',
          args: [
            takerAddress,
            judgeAddress,
            USDC_ADDRESS,
            amountInUnits,
            amountInUnits,
            acceptByTimestamp,
            resolveByTimestamp,
          ],
        })
      })
    }
  }, [
    approvalConfirmed,
    refetchAllowance,
    step,
    address,
    predictedBetAddress,
    formData.amount,
    formData.takerUser,
    formData.judgeUser,
    formData.expiresAt,
    createBet,
  ])

  // When bet creation is confirmed, extract bet address from logs
  useEffect(() => {
    if (betCreationConfirmed && betCreationReceipt) {
      // Find the BetCreated event log
      const betCreatedLog = betCreationReceipt.logs.find(
        (log) => log.address.toLowerCase() === BETFACTORY_ADDRESS.toLowerCase()
      )

      if (betCreatedLog) {
        try {
          const decodedLog = decodeEventLog({
            abi: BETFACTORY_ABI,
            data: betCreatedLog.data,
            topics: betCreatedLog.topics,
          })

          if (decodedLog.eventName === 'BetCreated') {
            const betAddr = decodedLog.args.bet as Address
            setCreatedBetAddress(betAddr)
          }
        } catch (error) {
          console.error('Error decoding BetCreated event:', error)
        }
      }
    }
  }, [betCreationConfirmed, betCreationReceipt])

  const handleReset = () => {
    setStep(1)
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
    resetApproval()
    resetBetCreation()
  }

  const getFullDescription = (): string => {
    const parts = [formData.description]
    if (formData.expiresAt) {
      parts.push('by', formatDisplayDate(formData.expiresAt))
    }
    return parts.join(' ')
  }

  const handleCreateBet = async () => {
    console.log('handleCreateBet called, current step:', step)
    // Only allow actual submission on step 5
    if (step !== 5 || !address) {
      console.log('Blocked submission - not on step 5 or no address')
      return
    }

    try {
      // Convert amount to proper units (USDC has 6 decimals)
      const amountInUnits = parseUnits(formData.amount, 6)

      // Resolve addresses from Farcaster users
      const takerAddress: Address = formData.takerUser?.fid
        ? (await resolveAddressFromFid(formData.takerUser.fid)) ||
          ('0x0000000000000000000000000000000000000000' as Address)
        : ('0x0000000000000000000000000000000000000000' as Address)

      const judgeAddress: Address = formData.judgeUser?.fid
        ? (await resolveAddressFromFid(formData.judgeUser.fid)) ||
          ('0x0000000000000000000000000000000000000000' as Address)
        : ('0x0000000000000000000000000000000000000000' as Address)

      if (
        judgeAddress === '0x0000000000000000000000000000000000000000' &&
        formData.judgeUser?.fid
      ) {
        alert(
          'Could not resolve judge address. Please ensure the judge has a verified Ethereum address on Farcaster.'
        )
        return
      }

      // Calculate timestamps with new logic:
      // - acceptBy: 7 days from now (users have 7 days to accept the bet)
      // - resolveBy: expiresAt + 90 days (judge has 90 days after bet ends to resolve)
      const acceptByTimestamp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      const expiresAtTimestamp = Math.floor(
        new Date(formData.expiresAt).getTime() / 1000
      )
      const resolveByTimestamp = expiresAtTimestamp + 90 * 24 * 60 * 60

      // Predict bet address before approval
      console.log('Predicting bet address...')
      const predictedAddress = (await readContract(wagmiConfig, {
        address: BETFACTORY_ADDRESS,
        abi: BETFACTORY_ABI,
        functionName: 'predictBetAddress',
        args: [
          address, // maker (current user)
          takerAddress,
          USDC_ADDRESS,
          amountInUnits,
          amountInUnits,
          acceptByTimestamp,
          resolveByTimestamp,
        ],
      })) as Address

      console.log('Predicted bet address:', predictedAddress)
      setPredictedBetAddress(predictedAddress)

      // Check if we need to approve USDC to the predicted bet address
      const currentAllowance = allowance || BigInt(0)
      if (currentAllowance < amountInUnits) {
        console.log('Approving USDC to predicted bet address...')
        await approveUsdc({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [predictedAddress, amountInUnits], // ✅ Approve to bet contract, not factory
        })
        // Wait for approval to be confirmed before proceeding
        // The useEffect will handle creating bet after approval
        return
      }

      console.log('Creating bet on-chain...')
      await createBet({
        address: BETFACTORY_ADDRESS,
        abi: BETFACTORY_ABI,
        functionName: 'createBet',
        args: [
          takerAddress,
          judgeAddress,
          USDC_ADDRESS,
          amountInUnits,
          amountInUnits,
          acceptByTimestamp,
          resolveByTimestamp,
        ],
      })
    } catch (error) {
      console.error('Error creating bet:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleCreateBet()
  }

  const handleNext = () => {
    console.log('handleNext called, current step:', step)
    if (canProceed() && step < 5) {
      console.log('Advancing from step', step, 'to', step + 1)
      setStep((prev) => {
        console.log('setState: prev=', prev, 'next=', prev + 1)
        return prev < 5 ? prev + 1 : prev
      })
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
  }

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return formData.judge.trim().length > 0
      case 2:
        return (
          formData.amount.trim().length > 0 && parseFloat(formData.amount) > 0
        )
      case 3:
        return formData.dateOption !== null && formData.expiresAt !== ''
      case 4: {
        const username = currentUser?.username || 'testuser'
        const prefill = `${username} bets that `
        // User must have added content beyond the prefill
        return formData.description.length > prefill.length
      }
      case 5:
        return true
      default:
        return false
    }
  }

  const handleDateSelect = (option: DateOption) => {
    const now = new Date()
    let expiryDate: Date

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
      setFormData({ ...formData, dateOption: option, expiresAt: '' })
      return
    }

    setFormData({
      ...formData,
      dateOption: option,
      expiresAt: expiryDate.toISOString(),
    })
  }

  const handleCustomDateChange = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString)
      date.setHours(23, 59, 59, 999)
      setFormData({
        ...formData,
        dateOption: 'custom',
        expiresAt: date.toISOString(),
      })
    } else {
      setFormData({ ...formData, dateOption: 'custom', expiresAt: '' })
    }
  }

  const formatDisplayDate = (isoString: string): string => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) handleReset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="hidden sm:fixed sm:bottom-4 sm:right-4 sm:z-50 sm:flex sm:h-auto sm:w-auto sm:items-center sm:gap-2 sm:rounded-md sm:px-6 sm:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Create Bet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Bet</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Connection Check */}
          {!isConnected && (
            <div className="space-y-4 text-center">
              <Label className="text-lg font-semibold">Connect Wallet</Label>
              <p className="text-muted-foreground text-sm">
                Connect your wallet to create a bet
              </p>
              <Button
                type="button"
                onClick={() => {
                  const injectedConnector = connectors.find(
                    (c) => c.type === 'injected'
                  )
                  if (injectedConnector) {
                    connect({ connector: injectedConnector })
                  }
                }}
                className="w-full"
              >
                Connect Wallet
              </Button>
            </div>
          )}

          {/* Step 1 */}
          {isConnected && step === 1 && (
            <div className="space-y-4">
              <UserSearch
                label="Who are you betting?"
                placeholder="@username"
                helperText="Leave empty to allow anyone to accept"
                value={formData.taker}
                onChange={(value, user) =>
                  setFormData({ ...formData, taker: value, takerUser: user })
                }
              />
              <UserSearch
                label="Who should judge?"
                placeholder="@username"
                helperText="Pick someone both parties trust to decide the outcome"
                required
                value={formData.judge}
                onChange={(value, user) =>
                  setFormData({ ...formData, judge: value, judgeUser: user })
                }
              />
            </div>
          )}

          {/* Step 2 */}
          {isConnected && step === 2 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">How much USDC?</Label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 5, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, amount: preset.toString() })
                    }
                    className={`flex h-20 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                      formData.amount === preset.toString()
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
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="h-14 pl-14 pr-16 text-xl font-semibold"
                />
                <span className="text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium">
                  USDC
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Both you and your opponent will put up this amount
              </p>
            </div>
          )}

          {/* Step 3 */}
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

          {/* Step 4 */}
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
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  autoFocus
                  className="h-20 text-lg"
                />
                {formData.expiresAt && (
                  <p className="text-muted-foreground text-sm">
                    Bet ends:{' '}
                    <span className="font-medium">
                      {formatDisplayDate(formData.expiresAt)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5 */}
          {isConnected && step === 5 && (
            <div className="space-y-4">
              {/* Success State */}
              {betCreationConfirmed && createdBetAddress ? (
                <>
                  <div className="space-y-4 text-center">
                    <div className="text-4xl">🎉</div>
                    <Label className="text-lg font-semibold">
                      Bet Created Successfully!
                    </Label>
                    <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-sm">
                      <p className="text-muted-foreground text-xs">
                        Bet Contract Address
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
                </>
              ) : /* Loading States */ isApproving ||
                approvalWritten ||
                isCreatingBet ||
                isWaitingForBetCreation ? (
                <>
                  <div className="space-y-4 text-center">
                    <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
                    <Label className="text-lg font-semibold">
                      {isApproving || approvalWritten
                        ? 'Approving USDC...'
                        : isCreatingBet
                          ? 'Creating Bet...'
                          : 'Waiting for Confirmation...'}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {isApproving
                        ? 'Please approve USDC spending in your wallet'
                        : approvalWritten
                          ? 'Waiting for approval confirmation...'
                          : isCreatingBet
                            ? 'Please confirm the transaction in your wallet'
                            : 'Waiting for bet creation confirmation...'}
                    </p>
                  </div>
                </>
              ) : /* Error State */ betCreationError ? (
                <>
                  <div className="space-y-4 text-center">
                    <div className="text-4xl">❌</div>
                    <Label className="text-destructive text-lg font-semibold">
                      Transaction Failed
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {betCreationError.message}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetBetCreation()
                          resetApproval()
                        }}
                        className="flex-1"
                      >
                        Try Again
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleReset()
                          setOpen(false)
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* Normal Review */
                <>
                  <Label className="text-lg font-semibold">
                    Review Your Bet
                  </Label>
                  <div className="space-y-3">
                    <div className="bg-card space-y-3 rounded-lg border p-4">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Opponent
                        </p>
                        <p className="font-medium">
                          {formData.takerUser
                            ? `@${formData.takerUser.username}`
                            : 'Open to anyone'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Judge</p>
                        <p className="font-medium">
                          {formData.judgeUser
                            ? `@${formData.judgeUser.username}`
                            : formData.judge}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Amount</p>
                        <p className="font-medium">
                          {formData.amount} USDC (each)
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          End Date
                        </p>
                        <p className="font-medium">
                          {formatDisplayDate(formData.expiresAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Bet Description
                        </p>
                        <p className="font-medium">{formData.description}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          {isConnected && (
            <div className="flex gap-3 pt-4">
              {step > 1 && !betCreationConfirmed && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 text-base"
                  onClick={handleBack}
                  disabled={
                    isApproving ||
                    approvalWritten ||
                    isCreatingBet ||
                    isWaitingForBetCreation
                  }
                >
                  Back
                </Button>
              )}
              {step < 5 ? (
                <Button
                  type="button"
                  className="h-12 flex-1 text-base"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                </Button>
              ) : !betCreationConfirmed ? (
                <Button
                  type="button"
                  className="h-12 flex-1 text-base"
                  onClick={() => {
                    console.log('Create Bet button clicked')
                    handleCreateBet()
                  }}
                  disabled={
                    !canProceed() ||
                    isApproving ||
                    approvalWritten ||
                    isCreatingBet ||
                    isWaitingForBetCreation
                  }
                >
                  {isApproving || approvalWritten ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : isCreatingBet || isWaitingForBetCreation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Bet'
                  )}
                </Button>
              ) : null}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
