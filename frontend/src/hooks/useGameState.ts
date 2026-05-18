import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../stores/game'
import type { BetInRound, GamePhase } from '../types/game'

export interface GameState {
  phase: GamePhase
  multiplier: number
  roundId: string | null
  serverSeedHash: string | null
  crashPoint: number | null
  bets: BetInRound[]
  hasBet: boolean
}

/**
 * Provides the current game state from the WebSocket-driven store.
 * The store is populated by useGameSocket — mount that hook once at the page level.
 */
export function useGameState(): GameState {
  return useGameStore(useShallow((s) => ({
    phase: s.phase,
    multiplier: s.multiplier,
    roundId: s.roundId,
    serverSeedHash: s.serverSeedHash,
    crashPoint: s.crashPoint,
    bets: s.bets,
    hasBet: s.hasBet,
  })))
}
