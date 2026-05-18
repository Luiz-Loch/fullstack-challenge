import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { keycloak } from '../lib/keycloak'
import { useGameStore } from '../stores/game'
import { parseCentesimals } from '../types/game'

const SOCKET_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8000/games'

interface RoundBettingPayload {
  roundId: string
  serverSeedHash: string
}

interface MultiplierTickPayload {
  multiplier: string
}

interface RoundCrashedPayload {
  crashPoint: string
}

interface BetPlacedPayload {
  betId: string
  playerId: string
  amountCents: string
}

interface BetCashoutPayload {
  betId: string
  playerId: string
  payoutCents: string
  multiplier: string
}

/**
 * Connects to the game WebSocket and keeps the game store in sync.
 * Mount once at the game page level — unmount disconnects the socket.
 */
export function useGameSocket() {
  const queryClient = useQueryClient()
  const store = useGameStore()
  const playerId = keycloak.tokenParsed?.sub as string | undefined

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token: keycloak.token },
      transports: ['websocket'],
    })

    socket.on('round:betting', ({ roundId, serverSeedHash }: RoundBettingPayload) => {
      store.reset()
      store.setRound(roundId, serverSeedHash)
      store.setPhase('BETTING')
      queryClient.invalidateQueries({ queryKey: ['rounds', 'history'] })
    })

    socket.on('round:started', () => {
      store.setPhase('RUNNING')
    })

    socket.on('multiplier:tick', ({ multiplier }: MultiplierTickPayload) => {
      store.setMultiplier(parseCentesimals(multiplier))
    })

    socket.on('round:crashed', ({ crashPoint }: RoundCrashedPayload) => {
      store.setPhase('CRASHED')
      store.setCrash(parseCentesimals(crashPoint))
    })

    socket.on('bet:placed', ({ betId, playerId: betPlayerId, amountCents }: BetPlacedPayload) => {
      store.addBet({
        id: betId,
        amountCents,
        status: 'PENDING',
        payoutCents: null,
        cashedOutAt: null,
      })
      if (betPlayerId === playerId) store.setHasBet(true)
    })

    socket.on('bet:cashout', ({ betId, playerId: betPlayerId, payoutCents, multiplier }: BetCashoutPayload) => {
      store.updateBet(betId, {
        status: 'CASHED_OUT',
        payoutCents,
        cashedOutAt: new Date().toISOString(),
      })
      if (betPlayerId === playerId) {
        store.setHasBet(false)
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
      }
    })

    return () => { socket.disconnect() }
  }, [])
}
