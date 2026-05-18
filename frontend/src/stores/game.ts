import { create } from 'zustand'
import type { BetInRound, GamePhase } from '../types/game'

interface GameStore {
  phase: GamePhase
  multiplier: number
  roundId: string | null
  serverSeedHash: string | null
  crashPoint: number | null
  bets: BetInRound[]
  hasBet: boolean

  setPhase: (phase: GamePhase) => void
  setMultiplier: (multiplier: number) => void
  setRound: (roundId: string, serverSeedHash: string) => void
  setCrash: (crashPoint: number) => void
  addBet: (bet: BetInRound) => void
  updateBet: (betId: string, patch: Partial<BetInRound>) => void
  setHasBet: (hasBet: boolean) => void
  reset: () => void
}

const INITIAL: Pick<GameStore, 'phase' | 'multiplier' | 'roundId' | 'serverSeedHash' | 'crashPoint' | 'bets' | 'hasBet'> = {
  phase: 'BETTING',
  multiplier: 1,
  roundId: null,
  serverSeedHash: null,
  crashPoint: null,
  bets: [],
  hasBet: false,
}

export const useGameStore = create<GameStore>((set) => ({
  ...INITIAL,

  setPhase: (phase) => set({ phase }),
  setMultiplier: (multiplier) => set({ multiplier }),
  setRound: (roundId, serverSeedHash) => set({ roundId, serverSeedHash }),
  setCrash: (crashPoint) => set({ crashPoint }),
  addBet: (bet) => set((s) => ({ bets: [...s.bets, bet] })),
  updateBet: (betId, patch) =>
    set((s) => ({ bets: s.bets.map((b) => (b.id === betId ? { ...b, ...patch } : b)) })),
  setHasBet: (hasBet) => set({ hasBet }),
  reset: () => set({ ...INITIAL }),
}))
