import { Hono } from 'hono'
import { client, graphql, replaceBigInts } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { getEnrichedBets } from './handlers/bets'

const app = new Hono()

app.use('/sql/*', client({ db, schema }))

app.use('/', graphql({ db, schema }))
app.use('/graphql', graphql({ db, schema }))

app.get('/bets', async (c) => {
  const bets = await getEnrichedBets()
  return c.json(replaceBigInts(bets, (b) => b.toString()))
})

export default app
