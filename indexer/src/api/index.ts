import { Hono } from 'hono'
import { client, graphql, replaceBigInts } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { getEnrichedBets } from './handlers/bets'
import { fetchUserByAddress } from '../neynar'

const app = new Hono()

app.use('/sql/*', client({ db, schema }))

app.use('/', graphql({ db, schema }))
app.use('/graphql', graphql({ db, schema }))

app.get('/bets', async (c) => {
  const bets = await getEnrichedBets()
  return c.json(replaceBigInts(bets, (b) => b.toString()))
})

app.get('/user/:address', async (c) => {
  const address = c.req.param('address')
  const user = await fetchUserByAddress(address)
  return c.json(user)
})

export default app
