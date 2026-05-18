import { api } from '../lib/api'

export interface Wallet {
  id: string;
  playerId: string;
  balanceCents: string;
}

export const walletService = {
  getMyWallet: () => api.get<Wallet>('wallets/me').then((r) => r.data),
  create: () => api.post<void>('wallets').then((r) => r.data),
}
