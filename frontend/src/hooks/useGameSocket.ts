import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { keycloak } from '../lib/keycloak'
import { gameService } from '../services/game.service'
import { useGameStore } from '../stores/game'
import { parseCentesimals } from '../types/game'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'http://localhost:8000'

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
  username: string
  amountCents: string
}

interface BetCashoutPayload {
  betId: string
  playerId: string
  payoutCents: string
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
    const socket = io(`${WS_BASE}/games`, {
      path: '/games/socket.io',
      auth: { token: keycloak.token },
      transports: ['websocket'],
    })

    gameService.getCurrentRound().then((round) => {
      store.setRound(round.id, round.serverSeedHash)
      store.setPhase(round.status)
      store.setMultiplier(parseCentesimals(round.multiplier))
      round.bets.forEach((bet) => store.addBet(bet))
    }).catch(() => {})

    socket.on('round:betting', ({ roundId, serverSeedHash }: RoundBettingPayload) => {
      store.reset()
      store.setRound(roundId, serverSeedHash)
      store.setPhase('BETTING')
      queryClient.invalidateQueries({ queryKey: ['rounds', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['bets', 'current'] })
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

    socket.on('bet:placed', ({ betId, playerId: betPlayerId, username, amountCents }: BetPlacedPayload) => {
      store.addBet({ id: betId, username, amountCents, status: 'PENDING', payoutCents: null, cashedOutAt: null })
      if (betPlayerId === playerId) store.setHasBet(true)
      queryClient.invalidateQueries({ queryKey: ['bets', 'current'] })
    })

    socket.on('bet:cashout', ({ betId, playerId: betPlayerId, payoutCents }: BetCashoutPayload) => {
      store.updateBet(betId, { status: 'CASHED_OUT', payoutCents })
      if (betPlayerId === playerId) store.setHasBet(false)
      queryClient.invalidateQueries({ queryKey: ['bets', 'current'] })
    })

    return () => { socket.disconnect() }
  }, [])
}
