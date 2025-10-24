import { Address } from 'viem'

// BetFactory contract on Base
export const BETFACTORY_ADDRESS: Address =
  '0x1b535d459A42249dB93d1824C046e46F6F7d71C1'

// USDC contract on Base
export const USDC_ADDRESS: Address =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// BetFactory ABI
export const BETFACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_owner', type: 'address' },
      { internalType: 'address', name: '_betImplementation', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'BetNotFound', type: 'error' },
  { inputs: [], name: 'FailedDeployment', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
      { internalType: 'uint256', name: 'needed', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'bet', type: 'address' },
    ],
    name: 'BetCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'ImplementationUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      { indexed: true, internalType: 'address', name: 'pool', type: 'address' },
    ],
    name: 'PoolConfigured',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newTreasury',
        type: 'address',
      },
    ],
    name: 'TreasuryUpdated',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
    name: 'bet',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'maker', type: 'address' },
          { internalType: 'uint40', name: 'acceptBy', type: 'uint40' },
          { internalType: 'uint40', name: 'resolveBy', type: 'uint40' },
          { internalType: 'enum IBet.Status', name: 'status', type: 'uint8' },
          { internalType: 'address', name: 'taker', type: 'address' },
          { internalType: 'address', name: 'judge', type: 'address' },
          { internalType: 'address', name: 'asset', type: 'address' },
          { internalType: 'address', name: 'winner', type: 'address' },
          { internalType: 'uint256', name: 'makerStake', type: 'uint256' },
          { internalType: 'uint256', name: 'takerStake', type: 'uint256' },
        ],
        internalType: 'struct IBet.Bet',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'betCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'betImplementation',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'taker', type: 'address' },
      { internalType: 'address', name: 'judge', type: 'address' },
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'makerStake', type: 'uint256' },
      { internalType: 'uint256', name: 'takerStake', type: 'uint256' },
      { internalType: 'uint40', name: 'acceptBy', type: 'uint40' },
      { internalType: 'uint40', name: 'resolveBy', type: 'uint40' },
    ],
    name: 'createBet',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'maker', type: 'address' },
      { internalType: 'address', name: 'taker', type: 'address' },
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'makerStake', type: 'uint256' },
      { internalType: 'uint256', name: 'takerStake', type: 'uint256' },
      { internalType: 'uint40', name: 'acceptBy', type: 'uint40' },
      { internalType: 'uint40', name: 'resolveBy', type: 'uint40' },
    ],
    name: 'predictBetAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_token', type: 'address' },
      { internalType: 'address', name: '_pool', type: 'address' },
    ],
    name: 'setPool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_treasury', type: 'address' }],
    name: 'setTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'tokenToPool',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_betImplementation',
        type: 'address',
      },
    ],
    name: 'updateImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

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
