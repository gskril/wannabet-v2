import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

// pnpm hardhat ignition deploy ignition/modules/deployFactory.ts --network base --strategy create2
// pnpm hardhat verify --network base 0x1234567890... (owner address) (implementation address)
export default buildModule('DeployModule', (m) => {
  const betFactory = m.contract('BetFactory', [
    '0x179A862703a4adfb29896552DF9e307980D19285',
    '0x74E3C9eB3e760Fde62b73811d820758DC07cC88E',
  ])

  return { betFactory }
})
