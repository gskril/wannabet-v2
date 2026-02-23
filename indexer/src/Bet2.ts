import { decodeFunctionData } from 'viem'
import { ponder } from 'ponder:registry'
import { bet, betCreatedEvent, factoryBetCreatedEvent } from 'ponder:schema'
import { BET_FACTORY_V2 } from 'shared'

const JUDGING_WINDOW = 30 * 24 * 60 * 60 // 30 days in seconds

ponder.on('Bet2Factory:BetCreated', async ({ event, context }) => {
  // Decode createBet calldata to get all bet parameters directly from the
  // factory transaction. This is more reliable than listening for the child
  // contract's BetCreated event, which Ponder intermittently fails to process.
  const { args } = decodeFunctionData({
    abi: BET_FACTORY_V2.abi,
    data: event.transaction.input,
  })
  const [taker, judge, asset, makerStake, takerStake, acceptBy, endsBy, description] =
    args as [string, string, string, bigint, bigint, number, number, string]

  const maker = event.transaction.from
  const betAddress = event.args.bet
  const judgeDeadline = Number(endsBy) + JUDGING_WINDOW

  await context.db.insert(factoryBetCreatedEvent).values({
    bet: betAddress,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
  })

  await context.db.insert(betCreatedEvent).values({
    id: event.id,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
    bet: betAddress,
    maker,
    taker,
    judge,
    asset,
    acceptBy: Number(acceptBy),
    endsBy: Number(endsBy),
    makerStake,
    takerStake,
    description,
  })

  await context.db.insert(bet).values({
    address: betAddress,
    maker,
    taker,
    judge,
    asset,
    acceptBy: Number(acceptBy),
    endsBy: Number(endsBy),
    makerStake,
    takerStake,
    description,
    createdAt: Number(event.block.timestamp),
    judgeDeadline,
    version: 2,
    blockNumber: Number(event.block.number),
  })
})

ponder.on('Bet2:BetAccepted', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    acceptedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetResolved', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    winner: event.args.winner,
    resolvedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetCancelled', async ({ event, context }) => {
  await context.db.update(bet, { address: event.log.address }).set({
    cancelledAt: Number(event.block.timestamp),
  })
})
