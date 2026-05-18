import { useQuery } from '@tanstack/react-query'
import { gameService } from '../services/game.service'
import { parseCentesimals } from '../types/game'

function badgeStyle(point: number) {
  if (point < 1.5) return 'text-red-400 bg-red-950 border-red-900'
  if (point < 3)   return 'text-yellow-400 bg-yellow-950 border-yellow-900'
  return 'text-green-400 bg-green-950 border-green-900'
}

export function RoundHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['rounds', 'history'],
    queryFn: () => gameService.getHistory(10),
  })

  const rounds = data?.data ?? []

  return (
    <div className="shrink-0 bg-gray-900 rounded-xl border border-gray-800 px-3 py-2 flex items-center gap-2">
      <span className="text-xs text-gray-600 uppercase tracking-widest shrink-0">Histórico</span>

      <div className="flex flex-1 gap-1.5">
        {isLoading && (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-6 rounded bg-gray-800 animate-pulse" />
          ))
        )}

        {rounds.map((r) => {
          const point = parseCentesimals(r.crashPoint)
          return (
            <span
              key={r.id}
              className={`flex-1 text-center py-1 rounded border text-xs font-bold tabular-nums ${badgeStyle(point)}`}
            >
              {point.toFixed(2)}x
            </span>
          )
        })}
      </div>
    </div>
  )
}
