import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { PlayerInfo } from '../components/PlayerInfo'
import { CrashGraph } from '../components/CrashGraph'
import { BetControls } from '../components/BetControls'
import { RoundHistory } from '../components/RoundHistory'
import { BetsList } from '../components/BetsList'

export const Route = createFileRoute('/game')({
  component: GamePage,
})

function GamePage() {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) navigate({ to: '/login' })
  }, [token, navigate])

  if (!token) return null

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-gray-800 px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-400 tracking-tight">Crash Game</h1>
        <PlayerInfo />
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
        {/* Left: graph + history */}
        <div className="md:col-span-2 flex flex-col gap-3 min-h-0">
          <CrashGraph phase="betting" multiplier={1} />
          <RoundHistory />
        </div>

        {/* Right: bet controls + current bets */}
        <div className="flex flex-col gap-3 min-h-0">
          <BetControls />
          <BetsList />
        </div>
      </main>
    </div>
  )
}
