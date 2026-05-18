import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Timer } from 'lucide-react'
import { gameService } from '../services/game.service'
import { hasTwoDecimalsOrLess, validateBetAmount } from '../lib/validations'
import { useGameState } from '../hooks/useGameState'

export function BetControls() {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [placedAmountCents, setPlacedAmountCents] = useState<number | null>(null)
  const [frozenPayout, setFrozenPayout] = useState<number | null>(null)

  const { phase, multiplier, hasBet } = useGameState()

  const betMutation = useMutation({
    mutationFn: (amountCents: number) => gameService.placeBet({ amountCents }),
    onSuccess: (_, amountCents) => {
      setPlacedAmountCents(amountCents)
      setAmount('')
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })

  const cashOutMutation = useMutation({
    mutationFn: gameService.cashOut,
    onSuccess: (data) => {
      setFrozenPayout(Number(data.payoutCents) / 100)
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })

  useEffect(() => {
    if (!hasBet) {
      setPlacedAmountCents(null)
      setFrozenPayout(null)
    }
  }, [hasBet])

  const isBettingOpen = phase === 'BETTING' && !hasBet
  const canCashOut = phase === 'RUNNING' && hasBet
  const amountValue = Number(amount)
  const amountError = amount ? validateBetAmount(amountValue) : null
  const potentialPayout = hasBet && placedAmountCents !== null
    ? (placedAmountCents / 100) * multiplier
    : null

  function handleBet() {
    const cents = Math.round(amountValue * 100)
    if (!cents || amountError) return
    betMutation.mutate(cents)
  }

  function handleCashOut() {
    setFrozenPayout(potentialPayout)
    cashOutMutation.mutate()
  }

  return (
    <div className="shrink-0 bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Apostar</h2>
        {phase === 'BETTING' && (
          <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-mono">
            <Timer size={12} />
            aguardando
          </span>
        )}
        {phase === 'RUNNING' && (
          <span className="text-green-400 text-xs font-mono font-bold">
            {multiplier.toFixed(2)}x
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Valor (R$)</label>
        <input
          type="number"
          min="1"
          max="1000"
          value={amount}
          onChange={(e) => {
            const v = e.target.value
            if (hasTwoDecimalsOrLess(v)) setAmount(v)
          }}
          placeholder="0,00"
          disabled={!isBettingOpen}
          className={`w-full bg-gray-800 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 disabled:opacity-40 transition-colors ${
            amountError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : 'border-gray-700 focus:border-green-500 focus:ring-green-500/30'
          }`}
        />
        {amountError && <p className="text-red-400 text-xs">{amountError}</p>}

        <div className="grid grid-cols-4 gap-1.5">
          {['5', '10', '25', '50'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              disabled={!isBettingOpen}
              className="py-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-300 text-xs hover:border-green-600 hover:text-green-400 disabled:opacity-40 transition-colors"
            >
              R${v}
            </button>
          ))}
        </div>
      </div>

      {canCashOut ? (
        <button
          type="button"
          onClick={handleCashOut}
          disabled={cashOutMutation.isPending}
          className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-60"
        >
          {frozenPayout !== null
            ? `Sacando · R$ ${frozenPayout.toFixed(2)}`
            : potentialPayout !== null
              ? `Cash Out · R$ ${potentialPayout.toFixed(2)}`
              : 'Cash Out'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleBet}
          disabled={!isBettingOpen || !amount || !!amountError || betMutation.isPending}
          className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors shadow-[0_0_20px_rgba(74,222,128,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {betMutation.isPending ? 'Enviando...' : 'Apostar'}
        </button>
      )}

      {betMutation.isError && (
        <p className="text-red-400 text-xs text-center">{(betMutation.error as Error).message}</p>
      )}
      {cashOutMutation.isError && (
        <p className="text-red-400 text-xs text-center">{(cashOutMutation.error as Error).message}</p>
      )}
    </div>
  )
}
