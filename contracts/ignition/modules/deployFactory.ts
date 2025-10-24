import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

// pnpm hardhat ignition deploy ignition/modules/deployFactory.ts --network base --strategy create2
// pnpm hardhat verify --network base 0x1234567890... (owner address) (implementation address)
export default buildModule('DeployModule', (m) => {
  const betFactory = m.contract('BetFactory', [
    '0x179A862703a4adfb29896552DF9e307980D19285',
    '0xEBf271Bc510F89bAef8657eA42758D28F33706Ce',
  ])

  return { betFactory }
})
