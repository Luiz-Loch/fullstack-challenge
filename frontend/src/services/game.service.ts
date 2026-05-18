import { api } from '../lib/api'
import type {
  BetHistoryItem,
  CashOutResponse,
  CurrentRound,
  Paginated,
  PlaceBetRequest,
  PlaceBetResponse,
  RoundHistoryItem,
  VerifyRoundResponse,
} from '../types/game'

export const gameService = {
  /** Returns the current round state including live multiplier and all placed bets. Throws 422 when no round is active. */
  getCurrentRound: () =>
    api.get<CurrentRound>('/games/rounds/current').then((r) => r.data),

  /** Returns a paginated list of completed rounds ordered by most recent first. */
  getHistory: (limit = 10, page = 1) =>
    api
      .get<Paginated<RoundHistoryItem>>('/games/rounds/history', { params: { page, limit } })
      .then((r) => r.data),

  /** Places a bet for the authenticated player in the current round. Round must be in BETTING state. */
  placeBet: (body: PlaceBetRequest) =>
    api.post<PlaceBetResponse>('/games/bet', body).then((r) => r.data),

  /** Cashes out the player's active bet at the current multiplier. Round must be in RUNNING state. */
  cashOut: () =>
    api.post<CashOutResponse>('/games/bet/cashout').then((r) => r.data),

  /** Returns a paginated list of the authenticated player's bet history. */
  getMyBets: (limit = 20, page = 1) =>
    api
      .get<Paginated<BetHistoryItem>>('/games/bets/me', { params: { page, limit } })
      .then((r) => r.data),

  /** Returns provably fair verification data for a completed round. */
  verifyRound: (roundId: string) =>
    api.get<VerifyRoundResponse>(`/games/rounds/${roundId}/verify`).then((r) => r.data),
}
