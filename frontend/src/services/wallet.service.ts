import { api } from '../lib/api'
import type { Wallet } from '../types/wallet'

export const walletService = {
  /** Returns the authenticated player's wallet including current balance in cents. */
  getMyWallet: () => api.get<Wallet>('/wallets/me').then((r) => r.data),

  /** Creates a wallet for the authenticated player. Idempotent — safe to call if wallet already exists. */
  create: () => api.post<void>('/wallets').then((r) => r.data),
}