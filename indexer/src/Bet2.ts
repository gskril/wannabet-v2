import { ponder } from 'ponder:registry'
import { bet, betCreatedEvent, factoryBetCreatedEvent } from 'ponder:schema'
import { BET_V2_ABI } from 'shared'

ponder.on('Bet2Factory:BetCreated', async ({ event, context }) => {
  console.log('Bet2Factory:BetCreated', event.args)

  await context.db.insert(factoryBetCreatedEvent).values({
    ...event.args,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetCreated', async ({ event, context }) => {
  console.log('Bet2:BetCreated', event.args)

  // Read judgeDeadline from the contract
  const judgeDeadline = await context.client.readContract({
    address: event.log.address,
    abi: BET_V2_ABI,
    functionName: 'judgingDeadline',
  })

  await context.db.insert(betCreatedEvent).values({
    ...event.args,
    bet: event.log.address,
    id: event.id,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
  })

  await context.db.insert(bet).values({
    ...event.args,
    address: event.log.address,
    createdAt: Number(event.block.timestamp),
    judgeDeadline,
    version: 2,
  })
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
