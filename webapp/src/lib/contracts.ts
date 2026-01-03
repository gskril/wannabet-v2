import type { Address } from 'viem'

// Re-export ABIs from shared package (source of truth)
export {
  BET_FACTORY_V1,
  BET_FACTORY_V2,
  BET_V1_ABI,
  BET_V2_ABI,
} from 'shared'

// Contract addresses on Base
export const BETFACTORY_ADDRESS: Address =
  '0x0F0A585aF686397d94428825D8cCfa2589b159A0'

export const USDC_ADDRESS: Address =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

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
