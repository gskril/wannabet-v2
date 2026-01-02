import { Context } from 'hono'
import { desc, replaceBigInts } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

export async function getBets() {
  const bets = await db
    .select()
    .from(schema.bet)
    .orderBy(desc(schema.bet.createdAt))

  return bets
}
