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
  version: t.integer().notNull(),
}))

export const betCreatedEvent = onchainTable('betCreatedEvent', (t) => ({
  id: t.text().primaryKey(),
  factory: t.hex().notNull(),
  timestamp: t.integer().notNull(),
  bet: t.hex().notNull(),
  maker: t.hex().notNull(),
  taker: t.hex().notNull(),
  judge: t.hex().notNull(),
  asset: t.hex().notNull(),
  acceptBy: t.integer().notNull(),
  endsBy: t.integer().notNull(),
  makerStake: t.bigint().notNull(),
  takerStake: t.bigint().notNull(),
  description: t.text().notNull(),
}))

export const factoryBetCreatedEvent = onchainTable(
  'factoryBetCreatedEvent',
  (t) => ({
    bet: t.hex().primaryKey(),
    factory: t.hex().notNull(),
    timestamp: t.integer().notNull(),
  })
)
