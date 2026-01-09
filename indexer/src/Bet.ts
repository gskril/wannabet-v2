import { ponder } from 'ponder:registry'
import { bet } from 'ponder:schema'

ponder.on('Bet:BetCreated', async ({ event, context }) => {
  // V1 ABI: 'resolveBy' was the judge deadline (no separate endsBy)
  // V2 ABI: 'endsBy' is when outcome must be known, judgeDeadline = endsBy + 30 days
  // TODO: Update to V2 ABI when ready (change resolveBy -> endsBy)
  const judgeDeadline = Number(event.args.resolveBy)
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
