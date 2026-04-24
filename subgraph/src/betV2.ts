import {
  BetCreated,
  BetAccepted,
  BetResolved,
  BetCancelled,
  BetV2,
} from "../generated/templates/BetV2/BetV2";
import { Bet, BetCreatedEvent } from "../generated/schema";
import { detectSource } from "./utils";

export function handleBetV2Created(event: BetCreated): void {
  // Read judgingDeadline via eth_call on the newly created Bet contract
  let contract = BetV2.bind(event.address);
  let judgingDeadlineResult = contract.try_judgingDeadline();
  let judgeDeadline = judgingDeadlineResult.reverted
    ? event.params.endsBy.toI32()
    : judgingDeadlineResult.value.toI32();

  let bet = new Bet(event.address.toHexString());
  bet.maker = event.params.maker;
  bet.taker = event.params.taker;
  bet.judge = event.params.judge;
  bet.asset = event.params.asset;
  bet.makerStake = event.params.makerStake;
  bet.takerStake = event.params.takerStake;
  bet.acceptBy = event.params.acceptBy.toI32();
  bet.endsBy = event.params.endsBy.toI32();
  bet.judgeDeadline = judgeDeadline;
  bet.description = event.params.description;
  bet.createdAt = event.block.timestamp.toI32();
  bet.version = 2;
  bet.source = detectSource(event.transaction.to);
  bet.save();

  let id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toString());
  let createdEvent = new BetCreatedEvent(id);
  createdEvent.factory = event.address;
  createdEvent.timestamp = event.block.timestamp.toI32();
  createdEvent.bet = event.address;
  createdEvent.maker = event.params.maker;
  createdEvent.taker = event.params.taker;
  createdEvent.judge = event.params.judge;
  createdEvent.asset = event.params.asset;
  createdEvent.acceptBy = event.params.acceptBy.toI32();
  createdEvent.endsBy = event.params.endsBy.toI32();
  createdEvent.makerStake = event.params.makerStake;
  createdEvent.takerStake = event.params.takerStake;
  createdEvent.description = event.params.description;
  createdEvent.save();
}

export function handleBetV2Accepted(event: BetAccepted): void {
  let bet = Bet.load(event.address.toHexString());
  if (bet === null) return;
  bet.acceptedAt = event.block.timestamp.toI32();
  bet.save();
}

export function handleBetV2Resolved(event: BetResolved): void {
  let bet = Bet.load(event.address.toHexString());
  if (bet === null) return;
  bet.winner = event.params.winner;
  bet.resolvedAt = event.block.timestamp.toI32();
  bet.save();
}

export function handleBetV2Cancelled(event: BetCancelled): void {
  let bet = Bet.load(event.address.toHexString());
  if (bet === null) return;
  bet.cancelledAt = event.block.timestamp.toI32();
  bet.save();
}
