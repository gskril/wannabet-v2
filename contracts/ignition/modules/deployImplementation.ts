import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('DeployModule', (m) => {
  const betImplementation = m.contract('Bet')

  return { betImplementation }
})
