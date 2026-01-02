import { onchainTable } from 'ponder'

export const bet = onchainTable('bet', (t) => ({
  address: t.hex().primaryKey(),
  maker: t.hex().notNull(),
  taker: t.hex().notNull(),
  judge: t.hex().notNull(),
  winner: t.hex(),
  asset: t.hex().notNull(),
  makerStake: t.bigint().notNull(),
  takerStake: t.bigint().notNull(),
  acceptBy: t.integer().notNull(),
  acceptedAt: t.integer(),
  cancelledAt: t.integer(),
  endsBy: t.integer().notNull(),
  judgeDeadline: t.integer().notNull(),
  resolvedAt: t.integer(),
  description: t.text().notNull(),
  createdAt: t.integer().notNull(),
}))
