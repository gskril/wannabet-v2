import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

// pnpm hardhat ignition deploy ignition/modules/deployImplementation.ts --network base --strategy create2
// pnpm hardhat verify --network base 0x1234567890...
export default buildModule('DeployModule', (m) => {
  const betImplementation = m.contract('Bet')

  return { betImplementation }
})
