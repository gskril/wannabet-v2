import { Hono } from 'hono'
import { client, graphql, replaceBigInts } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { getBets } from './handlers/bets'

const app = new Hono()

app.use('/sql/*', client({ db, schema }))

app.use('/', graphql({ db, schema }))
app.use('/graphql', graphql({ db, schema }))

app.get('/bets', async (c) => {
  const bets = await getBets()
  return c.json(replaceBigInts(bets, (b) => b.toString()))
})

export default app
