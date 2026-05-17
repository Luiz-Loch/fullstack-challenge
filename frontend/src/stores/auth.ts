import { create } from 'zustand'

interface AuthState {
  token: string | null
  username: string | null
  ready: boolean
  setAuth: (token: string, username: string) => void
  setReady: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  ready: false,
  setAuth: (token, username) => set({ token, username }),
  setReady: () => set({ ready: true }),
  logout: () => set({ token: null, username: null }),
}))
