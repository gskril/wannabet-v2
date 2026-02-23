import { ponder } from 'ponder:registry'
import { bet, betCreatedEvent, factoryBetCreatedEvent } from 'ponder:schema'

const JUDGING_WINDOW = 30 * 24 * 60 * 60 // 30 days in seconds

ponder.on('Bet2Factory:BetCreated', async ({ event, context }) => {
  await context.db.insert(factoryBetCreatedEvent).values({
    ...event.args,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetCreated', async ({ event, context }) => {
  // Compute judgeDeadline from event args: endsBy + 30 days (matches contract logic)
  const judgeDeadline = Number(event.args.endsBy) + JUDGING_WINDOW

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
