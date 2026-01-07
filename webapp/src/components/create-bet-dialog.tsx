'use client'

import { Loader2, Plus } from 'lucide-react'
import Image from 'next/image'
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'

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
import { DatePicker } from '@/components/date-picker'
import { UserSearch } from '@/components/user-search'
import type { FarcasterUser } from 'indexer/types'

type SubmitPhase = 'idle' | 'submitting' | 'done'

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

  const isSubmitting = phase === 'submitting'

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setPhase('idle')
  }, [])

  // Update form field
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Mock submit - just shows success after a delay
  const handleSubmit = useCallback(async () => {
    setPhase('submitting')

    // TODO: Implement real bet creation
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setPhase('done')
  }, [])

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
                (This is a mock - real creation not implemented yet)
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <Button
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

          {/* Form */}
          {phase !== 'done' && (
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
                <Textarea
                  placeholder="e.g., the Knicks will win the championship this season"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[72px] resize-none bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-wb-brown">When it ends</Label>
                <DatePicker
                  value={formData.expiresAt}
                  onChange={(date) => updateField('expiresAt', date)}
                  minDate={new Date()}
                  placeholder="Select end date"
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
                {isSubmitting ? 'Creating...' : 'Create Bet'}
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
