import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      navigate({ to: '/game' })
    } else {
      navigate({ to: '/login' })
    }
  }, [token, navigate])

  return null
}
