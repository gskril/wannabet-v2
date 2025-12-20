'use client'

import { sendCallsSync } from '@wagmi/core'
import { Loader2, Plus } from 'lucide-react'
import Image from 'next/image'
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type Address,
  decodeEventLog,
  encodeFunctionData,
  parseUnits,
  zeroAddress,
} from 'viem'
import { base } from 'viem/chains'
import { useAccount, useConnect, useReadContract, useSwitchChain } from 'wagmi'
import { getCallsStatus, getConnections, readContract } from 'wagmi/actions'

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
import {
  BETFACTORY_ABI,
  BETFACTORY_ADDRESS,
  ERC20_ABI,
  USDC_ADDRESS,
} from '@/lib/contracts'
import type { FarcasterUser } from '@/lib/types'
import { wagmiConfig } from '@/lib/wagmi-config'

/* --------------------------------
 * Constants
 * -------------------------------- */
const BASE_CHAIN_ID = base.id

type SubmitPhase =
  | 'idle'
  | 'approving'
  | 'creating'
  | 'confirming'
  | 'verifying'
  | 'done'

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
  amount: '100',
  expiresAt: '',
  description: '',
}

/* --------------------------------
 * Component
 * -------------------------------- */
export function CreateBetDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [phase, setPhase] = useState<SubmitPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [createdBetAddress, setCreatedBetAddress] = useState<Address | null>(
    null
  )
  const [betCreationHash, setBetCreationHash] = useState<`0x${string}` | null>(
    null
  )

  const mounted = useRef(true)

  // Web3 hooks
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    chainId: BASE_CHAIN_ID,
    query: { enabled: isConnected && !!address },
  })

  // Format USDC balance for display
  const formattedBalance = useMemo(() => {
    if (!usdcBalance) return null
    return (Number(usdcBalance) / 1e6).toLocaleString()
  }, [usdcBalance])

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

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
    const hasOpponent = formData.taker.trim().length > 0
    const hasDescription = formData.description.trim().length > 5
    const hasValidDate = formData.expiresAt.length > 0
    const hasValidAmount = Number(formData.amount) > 0
    const hasJudge = formData.judge.trim().length > 0

    return (
      hasOpponent &&
      hasDescription &&
      hasValidDate &&
      hasValidAmount &&
      hasJudge
    )
  }, [formData])

  const isSubmitting = phase !== 'idle' && phase !== 'done'

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setPhase('idle')
    setError(null)
    setCreatedBetAddress(null)
    setBetCreationHash(null)
  }, [])

  // Update form field
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Submit bet
  const handleSubmit = useCallback(async () => {
    setError(null)

    if (!isConnected || !address) {
      setError('Connect your wallet to continue.')
      return
    }

    // Switch to Base if needed
    if (chain?.id !== BASE_CHAIN_ID) {
      try {
        await switchChainAsync({ chainId: BASE_CHAIN_ID })
      } catch {
        setError('Please switch to Base network.')
        return
      }
    }

    try {
      // Parse amount
      const amountNum = Number(formData.amount)
      if (!isFinite(amountNum) || amountNum <= 0) {
        throw new Error('Enter a valid USDC amount.')
      }
      const amountInUnits = parseUnits(formData.amount, 6)

      // Resolve addresses
      const takerAddress: Address = formData.takerUser?.fid
        ? ((await resolveAddressFromFid(formData.takerUser.fid)) as Address) ||
          zeroAddress
        : zeroAddress

      const judgeAddress: Address = formData.judgeUser?.fid
        ? ((await resolveAddressFromFid(formData.judgeUser.fid)) as Address) ||
          zeroAddress
        : zeroAddress

      if (formData.judgeUser?.fid && judgeAddress === zeroAddress) {
        throw new Error(
          'Could not resolve judge address. Ensure judge has a verified ETH address.'
        )
      }

      // Calculate timing windows
      const acceptBy = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days to accept
      const expiresAtTs = Math.floor(
        new Date(formData.expiresAt).getTime() / 1000
      )
      const resolveBy = expiresAtTs + 90 * 24 * 60 * 60 // 90 days after expiry to resolve

      // Predict bet address for approval
      const predicted = (await readContract(wagmiConfig, {
        address: BETFACTORY_ADDRESS,
        abi: BETFACTORY_ABI,
        functionName: 'predictBetAddress',
        args: [address, takerAddress, acceptBy, resolveBy],
        chainId: BASE_CHAIN_ID,
      })) as Address

      if (!mounted.current) return

      // Build transaction data
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [predicted, amountInUnits],
      })

      const createBetData = encodeFunctionData({
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
      })

      // Send batch transaction
      setPhase('creating')
      const batchResult = await sendCallsSync(wagmiConfig, {
        calls: [
          { to: USDC_ADDRESS, data: approveData },
          { to: BETFACTORY_ADDRESS, data: createBetData },
        ],
        chainId: BASE_CHAIN_ID,
      })

      // Wait for confirmation
      setPhase('confirming')
      const connections = getConnections(wagmiConfig)
      const { receipts } = await getCallsStatus(wagmiConfig, {
        id: batchResult.id,
        connector: connections[0]?.connector,
      })

      setBetCreationHash(receipts?.[0]?.transactionHash || null)
      if (!receipts) throw new Error('No receipts found.')

      // Extract bet address from logs
      setPhase('verifying')
      const factoryLog = receipts
        .flatMap((r) => r.logs)
        .find(
          (log) =>
            log.address.toLowerCase() === BETFACTORY_ADDRESS.toLowerCase()
        )

      if (!factoryLog) throw new Error('No BetFactory log found.')

      const decoded = decodeEventLog({
        abi: BETFACTORY_ABI,
        data: factoryLog.data,
        // @ts-expect-error - topics type mismatch but works correctly
        topics: factoryLog.topics,
      })

      if (decoded.eventName !== 'BetCreated') {
        throw new Error('Unexpected event emitted.')
      }

      setCreatedBetAddress(decoded.args.bet)
      setPhase('done')
    } catch (err: unknown) {
      if (!mounted.current) return
      setPhase('idle')
      const message =
        (err as { shortMessage?: string })?.shortMessage ||
        (err as { message?: string })?.message ||
        'Unknown error'
      setError(message)
    }
  }, [isConnected, address, chain?.id, switchChainAsync, formData])

  // Button text based on state
  const buttonText = useMemo(() => {
    if (isSwitchingChain) return 'Switching Network...'
    if (phase === 'approving') return 'Approving USDC...'
    if (phase === 'creating') return 'Creating Bet...'
    if (phase === 'confirming') return 'Confirming...'
    if (phase === 'verifying') return 'Verifying...'
    return 'Create Bet'
  }, [phase, isSwitchingChain])

  /* --------------------------------
   * Render
   * -------------------------------- */
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

      <DrawerContent className="bg-wb-cream">
        <DrawerHeader>
          <DrawerTitle className="text-wb-brown">Create New Bet</DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pb-6">
          {/* Connect Wallet */}
          {!isConnected && (
            <div className="space-y-4 text-center">
              <p className="text-wb-taupe text-sm">
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

          {/* Success State */}
          {isConnected && phase === 'done' && createdBetAddress && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">🎉</div>
              <p className="text-wb-brown text-lg font-semibold">
                Bet Created Successfully!
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => window.location.reload()}
                >
                  View Bet
                </Button>
                {betCreationHash && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
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
              </div>
            </div>
          )}

          {/* Form */}
          {isConnected && phase !== 'done' && (
            <div className="space-y-5">
              {/* Opponent */}
              <UserSearch
                label="Who I'm betting"
                value={formData.taker}
                required
                onChange={(value, user) => {
                  updateField('taker', value)
                  updateField('takerUser', user)
                }}
                labelClassName="text-wb-brown"
                inputClassName="bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
              />

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-wb-brown">I am betting that...</Label>
                <Input
                  placeholder="e.g., the Knicks will win the championship this season"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-wb-brown">When it ends</Label>
                <Input
                  type="date"
                  value={
                    formData.expiresAt ? formData.expiresAt.split('T')[0] : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      const d = new Date(e.target.value)
                      d.setHours(23, 59, 59, 999)
                      updateField('expiresAt', d.toISOString())
                    } else {
                      updateField('expiresAt', '')
                    }
                  }}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-wb-brown">How much (each)</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    placeholder="100"
                    value={formData.amount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      // Only allow valid decimal input
                      const val = e.target.value
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        updateField('amount', val)
                      }
                    }}
                    className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Image
                      src="/img/usdc.png"
                      alt="USDC"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </div>
                </div>
                {formattedBalance && (
                  <p className="text-wb-coral text-xs">
                    Your Balance: {formattedBalance}
                  </p>
                )}
              </div>

              {/* Judge */}
              <UserSearch
                label="Who will judge"
                value={formData.judge}
                required
                onChange={(value, user) => {
                  updateField('judge', value)
                  updateField('judgeUser', user)
                }}
                labelClassName="text-wb-brown"
                inputClassName="bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
              />

              {/* Error */}
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                size="lg"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {buttonText}
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
