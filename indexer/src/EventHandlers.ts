/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  Bet,
  BetFactory,
  BetFactory_BetCreated,
  BetFactory_ImplementationUpdated,
  BetFactory_OwnershipTransferred,
  BetFactory_PoolConfigured,
  BetFactory_TreasuryUpdated,
  Bet_BetAccepted,
  Bet_BetCancelled,
  Bet_BetCreated,
  Bet_BetResolved,
  Bet_Initialized,
} from 'generated'

Bet.BetAccepted.handler(async ({ event, context }) => {
  const entity: Bet_BetAccepted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    address: event.srcAddress,
  }

  context.Bet_BetAccepted.set(entity)
})

Bet.BetCancelled.handler(async ({ event, context }) => {
  const entity: Bet_BetCancelled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    address: event.srcAddress,
  }

  context.Bet_BetCancelled.set(entity)
})

Bet.BetCreated.handler(async ({ event, context }) => {
  const entity: Bet_BetCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    address: event.srcAddress,
    maker: event.params.maker,
    taker: event.params.taker,
    asset: event.params.asset,
    acceptBy: event.params.acceptBy,
    resolveBy: event.params.resolveBy,
    makerStake: event.params.makerStake,
    takerStake: event.params.takerStake,
    createdAt: event.block.timestamp,
  }

  context.Bet_BetCreated.set(entity)
})

Bet.BetResolved.handler(async ({ event, context }) => {
  const entity: Bet_BetResolved = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    address: event.srcAddress,
    winner: event.params.winner,
    amount: event.params.amount,
  }

  context.Bet_BetResolved.set(entity)
})

Bet.Initialized.handler(async ({ event, context }) => {
  const entity: Bet_Initialized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    address: event.srcAddress,
    version: event.params.version,
  }

  context.Bet_Initialized.set(entity)
})

BetFactory.BetCreated.handler(async ({ event, context }) => {
  const entity: BetFactory_BetCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    bet: event.params.bet,
  }

  context.BetFactory_BetCreated.set(entity)
})

BetFactory.BetCreated.contractRegister(({ event, context }) => {
  context.addBet(event.params.bet)
  context.log.info('Bet created', { bet: event.params.bet })
})

BetFactory.ImplementationUpdated.handler(async ({ event, context }) => {
  const entity: BetFactory_ImplementationUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newImplementation: event.params.newImplementation,
  }

  context.BetFactory_ImplementationUpdated.set(entity)
})

BetFactory.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: BetFactory_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  }

  context.BetFactory_OwnershipTransferred.set(entity)
})

BetFactory.PoolConfigured.handler(async ({ event, context }) => {
  const entity: BetFactory_PoolConfigured = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    token: event.params.token,
    pool: event.params.pool,
  }

  context.BetFactory_PoolConfigured.set(entity)
})

BetFactory.TreasuryUpdated.handler(async ({ event, context }) => {
  const entity: BetFactory_TreasuryUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newTreasury: event.params.newTreasury,
  }

  context.BetFactory_TreasuryUpdated.set(entity)
})
