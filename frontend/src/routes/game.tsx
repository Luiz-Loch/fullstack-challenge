import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { PlayerInfo } from '../components/PlayerInfo'

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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-400">Crash Game</h1>
        <PlayerInfo />
      </header>

      <main className="flex-1 flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* <CrashGraph /> */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            {/* <BetControls /> */}
          </div>
          {/* <RoundHistory /> */}
        </div>

        {/* <BetsList /> */}
      </main>
    </div>
  )
}
