export type { Paginated } from './paginated'

export type GamePhase = 'BETTING' | 'RUNNING' | 'CRASHED'

export interface RoundHistoryItem {
  id: string
  /** Crash point in centesimals (e.g. "150" = 1.50x) */
  crashPoint: string
  serverSeedHash: string
  startedAt: string | null
  crashedAt: string | null
  createdAt: string
}

export interface BetInRound {
  id: string
  username: string
  amountCents: string
  status: 'PENDING' | 'CASHED_OUT' | 'LOST'
  payoutCents: string | null
  cashedOutAt: string | null
}

export interface CurrentRound {
  id: string
  status: 'BETTING' | 'RUNNING' | 'CRASHED'
  /** Multiplier in centesimals (e.g. "123" = 1.23x) */
  multiplier: string
  serverSeedHash: string
  bets: BetInRound[]
}

export interface PlaceBetRequest {
  /** Amount in cents (min 100 = R$1,00 · max 100_000 = R$1.000,00) */
  amountCents: number
}

export interface PlaceBetResponse {
  betId: string
  roundId: string
  amountCents: string
  placedAt: string
}

export interface CashOutResponse {
  betId: string
  roundId: string
  payoutCents: string
  cashedOutAt: string
}

export interface BetHistoryItem {
  id: string
  roundId: string
  amount: string
  status: 'PENDING' | 'CASHED_OUT' | 'LOST'
  payout: string | null
  cashedOutAt: string | null
  placedAt: string
}

export interface VerifyRoundResponse {
  roundId: string
  serverSeed: string
  serverSeedHash: string
  clientSeed: string
  /** Crash point in centesimals */
  crashPoint: string
  verified: boolean
}

/** Converts centesimals string to display multiplier (e.g. "150" → 1.50) */
export function parseCentesimals(centesimals: string): number {
  return Number(centesimals) / 100
}
