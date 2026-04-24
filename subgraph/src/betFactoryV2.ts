import { BetCreated } from "../generated/BetFactoryV2/BetFactoryV2";
import { BetV2 } from "../generated/templates";
import { FactoryBetCreatedEvent } from "../generated/schema";

export function handleBetFactoryV2BetCreated(event: BetCreated): void {
  BetV2.create(event.params.bet);

  let entity = new FactoryBetCreatedEvent(event.params.bet.toHexString());
  entity.factory = event.address;
  entity.timestamp = event.block.timestamp.toI32();
  entity.bet = event.params.bet;
  entity.save();
}
