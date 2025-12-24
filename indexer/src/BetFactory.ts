import { ponder } from 'ponder:registry'
import { bet } from 'ponder:schema'

ponder.on('Bet:BetCreated', async ({ event, context }) => {
  await context.db.insert(bet).values({
    ...event.args,
    address: event.log.address,
    createdAt: Number(event.block.timestamp),
  })
})
