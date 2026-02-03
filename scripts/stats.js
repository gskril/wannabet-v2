#!/usr/bin/env node

const INDEXER_URL = 'https://wannabet-v2-production.up.railway.app'

async function main() {
  console.log('Fetching bets from indexer...\n')

  const response = await fetch(`${INDEXER_URL}/bets`)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  const bets = await response.json()

  // Count by status
  const byStatus = {}
  let totalWagered = 0
  let currentlyEscrowed = 0

  for (const bet of bets) {
    byStatus[bet.status] = (byStatus[bet.status] || 0) + 1
    const amount = parseFloat(bet.amount) || 0
    totalWagered += amount

    // Calculate escrowed funds based on status
    // PENDING: only maker's stake is held
    // ACTIVE/JUDGING: both maker + taker stakes are held
    if (bet.status === 'PENDING') {
      currentlyEscrowed += amount
    } else if (bet.status === 'ACTIVE' || bet.status === 'JUDGING') {
      currentlyEscrowed += amount * 2 // maker + taker
    }
  }

  console.log('=== WannaBet Statistics ===\n')
  console.log(`Total bets created: ${bets.length}`)
  console.log('')
  console.log('By status:')
  for (const [status, count] of Object.entries(byStatus).sort()) {
    console.log(`  ${status}: ${count}`)
  }
  console.log('')
  console.log(`Total wagered (all time): $${totalWagered.toFixed(2)} USDC`)
  console.log(`Currently escrowed: $${currentlyEscrowed.toFixed(2)} USDC`)
}

main().catch(console.error)
