import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

// pnpm hardhat ignition deploy ignition/modules/deployFactory.ts --network base --strategy create2
// pnpm hardhat verify --network base 0x1234567890... (owner address) (implementation address)
export default buildModule('DeployModule', (m) => {
  const betFactory = m.contract('BetFactory', [
    '0x179A862703a4adfb29896552DF9e307980D19285',
    '0x51f4E1df3A1F5527Bd076cE2c9b46B0AE76a4332',
  ])

  return { betFactory }
})
