import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('DeployModule', (m) => {
  const betFactory = m.contract('BetFactory', [
    '0x179A862703a4adfb29896552DF9e307980D19285',
    '0x234186b59d13b3C45923702B15ddAb99C0A8a66F',
  ])

  return { betFactory }
})
