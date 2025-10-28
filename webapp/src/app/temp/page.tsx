'use client'

import { erc721Abi } from 'viem'
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { useMiniApp } from '@/components/sdk-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TempPage() {
  const tx = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: tx.data })
  const { address } = useAccount()
  const { miniAppUser } = useMiniApp()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const warpletId = miniAppUser?.fid
    const newOwner = e.currentTarget.newOwner.value

    if (!address || !newOwner || !warpletId) {
      alert('Something is not working')
      return
    }

    tx.writeContract({
      address: '0x699727f9e01a822efdcf7333073f0461e5914b4e',
      abi: erc721Abi,
      functionName: 'safeTransferFrom',
      args: [address, newOwner, BigInt(miniAppUser.fid)],
    })
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-y-4">
      <h1 className="text-2xl font-bold">Transfer Your Warplet</h1>

      <form className="flex flex-col gap-y-2" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Enter the new owner's address"
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
