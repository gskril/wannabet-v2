import { ReplaceBigInts } from 'ponder'

import { bet } from '../ponder.schema'

export type Bet = ReplaceBigInts<typeof bet.$inferSelect, string>
