import { BetCreated } from "../generated/BetFactoryV1/BetFactoryV1";
import { BetV1 } from "../generated/templates";
import { FactoryBetCreatedEvent } from "../generated/schema";

export function handleBetFactoryV1BetCreated(event: BetCreated): void {
  BetV1.create(event.params.bet);

  let entity = new FactoryBetCreatedEvent(event.params.bet.toHexString());
  entity.factory = event.address;
  entity.timestamp = event.block.timestamp.toI32();
  entity.bet = event.params.bet;
  entity.save();
}
