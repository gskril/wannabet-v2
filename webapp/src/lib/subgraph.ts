const GOLDSKY_URL =
  'https://api.goldsky.com/api/public/project_cmnbg4m0g1cjz01z25lxv0amr/subgraphs/wannabet/1.0.0/gn'

// Raw bet as returned by the subgraph (Bytes = hex string, BigInt = decimal string)
export type SubgraphBet = {
  id: string // bet contract address (lowercase hex)
  maker: string
  taker: string
  judge: string
  winner: string | null
  asset: string
  makerStake: string // decimal string
  takerStake: string // decimal string
  acceptBy: number
  acceptedAt: number | null
  cancelledAt: number | null
  endsBy: number
  judgeDeadline: number
  resolvedAt: number | null
  description: string
  createdAt: number
  version: number
  source: string | null
}

const BETS_QUERY = /* GraphQL */ `
  query Bets($source: String, $first: Int!) {
    bets(
      first: $first
      orderBy: createdAt
      orderDirection: desc
      where: { source: $source }
    ) {
      id
      maker
      taker
      judge
      winner
      asset
      makerStake
      takerStake
      acceptBy
      acceptedAt
      cancelledAt
      endsBy
      judgeDeadline
      resolvedAt
      description
      createdAt
      version
      source
    }
  }
`

async function query<T>(gql: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GOLDSKY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gql, variables }),
    next: { revalidate: 30 },
  })

  if (!res.ok) {
    throw new Error(`Subgraph request failed: ${res.status}`)
  }

  const json = await res.json()
  if (json.errors) {
    throw new Error(`Subgraph error: ${JSON.stringify(json.errors)}`)
  }

  return json.data as T
}

export async function fetchSubgraphBets(source?: string): Promise<SubgraphBet[]> {
  const data = await query<{ bets: SubgraphBet[] }>(BETS_QUERY, {
    source: source ?? null,
    first: 1000,
  })
  return data.bets
}
