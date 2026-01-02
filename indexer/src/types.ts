import { getBets } from './api/handlers/bets'

type ReplaceBigInts<T> = T extends bigint
  ? string
  : T extends Array<infer U>
    ? Array<ReplaceBigInts<U>>
    : T extends object
      ? { [K in keyof T]: ReplaceBigInts<T[K]> }
      : T

// The response from the /bets endpoint
export type Bet = ReplaceBigInts<Awaited<ReturnType<typeof getBets>>[number]>
