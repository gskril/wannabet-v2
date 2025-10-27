'use client'

import { erc721Abi } from 'viem'
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TempPage() {
  const tx = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: tx.data })
  const { address } = useAccount()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const warpletId = e.currentTarget.warpletId.value
    const newOwner = e.currentTarget.newOwner.value

    if (!address || !newOwner || !warpletId) {
      alert('Please fill in all fields')
      return
    }

    tx.writeContract({
      address: '0x699727f9e01a822efdcf7333073f0461e5914b4e',
      abi: erc721Abi,
      functionName: 'safeTransferFrom',
      args: [address, newOwner, warpletId],
    })
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-y-4">
      <h1 className="text-2xl font-bold">Transfer Your Warplet</h1>

      <form className="flex flex-col gap-y-2" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Enter your warplet ID"
          name="warpletId"
          id="warpletId"
        />
        <Input
          type="text"
          placeholder="Enter your new owner's address"
          name="newOwner"
          id="newOwner"
        />
        <Button type="submit">Transfer</Button>
      </form>

      {receipt.isSuccess && <div>Transaction successful</div>}
      {receipt.isError && <div>Transaction failed</div>}
    </div>
  )
}
