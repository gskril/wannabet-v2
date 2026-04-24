import { Bytes } from "@graphprotocol/graph-ts";
import {
  BetCreated,
  BetAccepted,
  BetResolved,
  BetCancelled,
} from "../generated/templates/BetV1/BetV1";
import { Bet, BetCreatedEvent } from "../generated/schema";
import { detectSource } from "./utils";

export function handleBetV1Created(event: BetCreated): void {
  // V1: resolveBy serves as both endsBy and judgeDeadline
  let judgeDeadline = event.params.resolveBy.toI32();

  let bet = new Bet(event.address.toHexString());
  bet.maker = event.params.maker;
  bet.taker = event.params.taker;
  bet.judge = event.params.judge;
  bet.asset = event.params.asset;
  bet.makerStake = event.params.makerStake;
  bet.takerStake = event.params.takerStake;
  bet.acceptBy = event.params.acceptBy.toI32();
  bet.endsBy = judgeDeadline;
  bet.judgeDeadline = judgeDeadline;
  bet.description = event.params.description;
  bet.createdAt = event.block.timestamp.toI32();
  bet.version = 1;
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
  createdEvent.endsBy = judgeDeadline;
  createdEvent.makerStake = event.params.makerStake;
  createdEvent.takerStake = event.params.takerStake;
  createdEvent.description = event.params.description;
  createdEvent.save();
}

export function handleBetV1Accepted(event: BetAccepted): void {
  let bet = Bet.load(event.address.toHexString());
  if (bet === null) return;
  bet.acceptedAt = event.block.timestamp.toI32();
  bet.save();
}

export function handleBetV1Resolved(event: BetResolved): void {
  let bet = Bet.load(event.address.toHexString());
  if (bet === null) return;
  bet.winner = event.params.winner;
  bet.resolvedAt = event.block.timestamp.toI32();
  bet.save();
}

export function handleBetV1Cancelled(event: BetCancelled): void {
  let bet = Bet.load(event.address.toHexString());
  if (bet === null) return;
  bet.cancelledAt = event.block.timestamp.toI32();
  bet.save();
}
