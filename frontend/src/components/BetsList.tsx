import { useQuery } from '@tanstack/react-query'
import { gameService } from '../services/game.service'

function formatCents(cents: string) {
  return (Number(cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function BetsList() {
  const { data: round } = useQuery({
    queryKey: ['bets', 'current'],
    queryFn: () => gameService.getCurrentRound(),
    retry: false,
    throwOnError: false,
  })
  const bets = round?.bets ?? []

  return (
    <div className="flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 flex flex-col">
      <div className="shrink-0 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Apostas da rodada
        </h2>
        <span className="text-xs text-gray-600">{bets.length} apostas</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {bets.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Nenhuma aposta ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-xs text-gray-600 uppercase">
                <th className="text-left px-4 py-2 font-medium">Aposta</th>
                <th className="text-right px-4 py-2 font-medium">Valor</th>
                <th className="text-right px-4 py-2 font-medium">Payout</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet) => (
                <tr key={bet.id} className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2 text-gray-300 text-sm">
                    {bet.username}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-400 tabular-nums">
                    {formatCents(bet.amountCents)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {bet.status === 'CASHED_OUT' && bet.payoutCents ? (
                      <span className="text-green-400 font-semibold">
                        {formatCents(bet.payoutCents)}
                      </span>
                    ) : bet.status === 'LOST' ? (
                      <span className="text-red-500">perdeu</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
