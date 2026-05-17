import { createFileRoute } from '@tanstack/react-router'
import { keycloak } from '../lib/keycloak'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-5xl font-bold text-white tracking-tight">Crash Game</h1>
          <p className="text-gray-400 mt-2">Powered by Luiz Loch</p>
        </div>
        <button
          type="button"
          onClick={() => keycloak.login({ redirectUri: `${window.location.origin}/` })}
          className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-10 rounded-lg text-lg transition-colors"
        >
          Entrar
        </button>
      </div>
    </div>
  )
}
