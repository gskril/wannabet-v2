import type { Address } from 'viem'
import { BET_FACTORY_V2, BET_V2_ABI } from 'shared'

export const USDC_ADDRESS: Address =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

export const USDC_DECIMALS = 6

export const BET_FACTORY_ADDRESS = BET_FACTORY_V2.address as Address
export const BET_FACTORY_ABI = BET_FACTORY_V2.abi
export const BET_ABI = BET_V2_ABI

// ERC20 ABI (minimal - just what we need for USDC)
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
