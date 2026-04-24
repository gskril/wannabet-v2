import { Address } from "@graphprotocol/graph-ts";

const FACTORY_V1 = Address.fromString(
  "0x0F0A585aF686397d94428825D8cCfa2589b159A0"
);
const FACTORY_V2 = Address.fromString(
  "0x252B30995510703D09cB4f3597b098D4a96b4E62"
);
const ENTRYPOINT_V07 = Address.fromString(
  "0x0000000071727de22e5e9d8baf0edac6f37da032"
);

export function detectSource(txTo: Address | null): string | null {
  if (txTo === null) return null;
  if (txTo.equals(FACTORY_V1) || txTo.equals(FACTORY_V2)) return "fc";
  if (txTo.equals(ENTRYPOINT_V07)) return "x";
  return null;
}
