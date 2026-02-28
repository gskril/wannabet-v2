import { Hono } from 'hono'
import { client, graphql, replaceBigInts, sql } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { getEnrichedBets } from './handlers/bets'
import { fetchUserByAddress } from '../neynar'

const VALID_SOURCES = new Set(['fc', 'x', 'web'])

const app = new Hono()

// Ensure the source_override table exists (runs once on first request)
let tableCreated = false
async function ensureSourceOverrideTable() {
  if (tableCreated) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS source_override (
      bet_address TEXT PRIMARY KEY,
      source TEXT NOT NULL
    )
  `)
  tableCreated = true
}

app.use('/sql/*', client({ db, schema }))

app.use('/', graphql({ db, schema }))
app.use('/graphql', graphql({ db, schema }))

app.get('/bets', async (c) => {
  const source = c.req.query('source')
  const bets = await getEnrichedBets(source ? { source } : undefined)
  return c.json(replaceBigInts(bets, (b) => b.toString()))
})

app.post('/bets/:address/source', async (c) => {
  const address = c.req.param('address').toLowerCase()
  const body = await c.req.json()
  const source = body?.source

  if (!source || !VALID_SOURCES.has(source)) {
    return c.json({ error: 'Invalid source. Must be one of: fc, x, web' }, 400)
  }

  await ensureSourceOverrideTable()
  await db.execute(sql`
    INSERT INTO source_override (bet_address, source)
    VALUES (${address}, ${source})
    ON CONFLICT (bet_address) DO UPDATE SET source = ${source}
  `)

  return c.json({ ok: true })
})

app.get('/user/:address', async (c) => {
  const address = c.req.param('address')
  const user = await fetchUserByAddress(address)
  return c.json(user)
})

export default app
