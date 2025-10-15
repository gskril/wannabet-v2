import { network } from 'hardhat'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

describe('BetFactory', async function () {
  const { viem } = await network.connect()

  it('Should return the name of the contract', async function () {
    const counter = await viem.deployContract('BetFactory', ['BetFactory'])
    const name = await counter.read.name()
    assert.equal(name, 'BetFactory')
  })
})
