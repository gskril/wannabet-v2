#!/usr/bin/env node

/**
 * Query WannaBet statistics directly from Base blockchain
 * Run: node scripts/stats-onchain.js
 */

const RPC_URL = 'https://mainnet.base.org'

const V1_FACTORY = '0x0F0A585aF686397d94428825D8cCfa2589b159A0'
const V2_FACTORY = '0x252B30995510703D09cB4f3597b098D4a96b4E62'

// betCount() selector = keccak256("betCount()")[0:4]
const BET_COUNT_SELECTOR = '0x5aa68ac0'

async function call(to, data) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
      id: 1,
    }),
  })
  const json = await response.json()
  if (json.error) throw new Error(json.error.message)
  return json.result
}

async function main() {
  console.log('Querying factory contracts on Base...\n')

  const [v1CountHex, v2CountHex] = await Promise.all([
    call(V1_FACTORY, BET_COUNT_SELECTOR),
    call(V2_FACTORY, BET_COUNT_SELECTOR),
  ])

  const v1Count = parseInt(v1CountHex, 16)
  const v2Count = parseInt(v2CountHex, 16)
  const totalBets = v1Count + v2Count

  console.log('=== WannaBet Bet Counts ===\n')
  console.log(`V1 Factory bets: ${v1Count}`)
  console.log(`V2 Factory bets: ${v2Count}`)
  console.log(`Total bets: ${totalBets}`)
  console.log('')
  console.log('Note: To get escrowed funds, run: node scripts/stats.js')
  console.log('(requires indexer API access)')
}

main().catch(console.error)
