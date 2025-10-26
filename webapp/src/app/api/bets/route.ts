import { getBets } from '@/lib/get-bets'

export async function GET(request: Request) {
  const bets = await getBets()

  if (bets.error) {
    return Response.json({ error: bets.error }, { status: 500 })
  }

  return Response.json(bets.data)
}
