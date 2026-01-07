import { ponder } from 'ponder:registry'
import { bet } from 'ponder:schema'
import { BET_V2_ABI } from 'shared'

ponder.on('Bet2:BetCreated', async ({ event, context }) => {
  console.log('Bet2:BetCreated', event)

  // Read judgeDeadline from the contract
  const judgeDeadline = await context.client.readContract({
    address: event.log.address,
    abi: BET_V2_ABI,
    functionName: 'judgingDeadline',
  })

  await context.db.insert(bet).values({
    ...event.args,
    address: event.log.address,
    createdAt: Number(event.block.timestamp),
    judgeDeadline,
    version: 2,
  })

  console.log('Inserted bet2', event.id)
})

ponder.on('Bet2:BetAccepted', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    acceptedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetResolved', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    winner: event.args.winner,
    resolvedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetCancelled', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    cancelledAt: Number(event.block.timestamp),
  })
})
