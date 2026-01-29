import { ponder } from 'ponder:registry'
import { bet, betCreatedEvent, factoryBetCreatedEvent } from 'ponder:schema'

ponder.on('BetFactory:BetCreated', async ({ event, context }) => {
  await context.db.insert(factoryBetCreatedEvent).values({
    ...event.args,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
  })
})

ponder.on('Bet:BetCreated', async ({ event, context }) => {
  // V1 ABI: 'resolveBy' was the judge deadline (no separate endsBy)
  // V2 ABI: 'endsBy' is when outcome must be known, judgeDeadline = endsBy + 30 days
  const judgeDeadline = Number(event.args.resolveBy)

  await context.db.insert(betCreatedEvent).values({
    ...event.args,
    bet: event.log.address,
    id: event.id,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
    endsBy: judgeDeadline,
  })

  await context.db.insert(bet).values({
    ...event.args,
    address: event.log.address,
    createdAt: Number(event.block.timestamp),
    endsBy: judgeDeadline, // V1 didn't have separate endsBy
    judgeDeadline,
    version: 1,
  })
})

ponder.on('Bet:BetAccepted', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    acceptedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet:BetResolved', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    winner: event.args.winner,
    resolvedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet:BetCancelled', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    cancelledAt: Number(event.block.timestamp),
  })
})
