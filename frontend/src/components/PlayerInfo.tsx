import { useQuery } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/auth'
import { keycloak } from '../lib/keycloak'
import { walletService } from '../services/wallet.service'

function formatBalance(cents: string) {
  return (Number(cents) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function PlayerInfo() {
  const { username, logout } = useAuthStore()

  function handleLogout() {
    logout()
    keycloak.logout({ redirectUri: window.location.origin + '/login' })
  }

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletService.getMyWallet,
    refetchInterval: 10_000, // Refetch wallet every 10 seconds to keep balance updated
  })

  return (
    <div className="flex items-center gap-4 text-sm">
      {username && (
        <span className="text-gray-400">
          {username}
        </span>
      )}
      <span className="font-mono font-semibold text-green-400">
        {isLoading ? '...' : wallet ? formatBalance(wallet.balanceCents) : '—'}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400 transition-colors text-xs"
      >
        <LogOut size={12} />
        Sair
      </button>
    </div>
  )
}
