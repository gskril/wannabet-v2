import { Hono } from 'hono'
import { client, desc, graphql, replaceBigInts } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

const app = new Hono()

app.use('/sql/*', client({ db, schema }))

app.use('/', graphql({ db, schema }))
app.use('/graphql', graphql({ db, schema }))

app.get('/bets', async (c) => {
  const bets = await db
    .select()
    .from(schema.bet)
    .orderBy(desc(schema.bet.createdAt))

  return c.json(replaceBigInts(bets, (b) => b.toString()))
})

export default app
