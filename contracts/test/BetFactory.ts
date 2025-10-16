import { network } from 'hardhat'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

describe('BetFactory', async function () {
  const { viem } = await network.connect()
  const owner = privateKeyToAccount(generatePrivateKey()).address

  it('Should return the name of the contract', async function () {
    const betImplementation = await viem.deployContract('Bet')
    const counter = await viem.deployContract('BetFactory', [
      owner,
      betImplementation.address,
    ])
    const name = await counter.read.name()
    assert.equal(name, 'BetFactory')
  })
})
