import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate({ to: '/login' })
    }
  }, [token, navigate])

  if (!token) return null

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white text-xl">Game — PR7</p>
    </div>
  )
}
