import { Wallet } from '../wallet.aggregate';

/** DI injection token for {@link IWalletRepository}. */
export const WALLET_REPOSITORY = Symbol('IWalletRepository');

/** Persistence port for the Wallet aggregate (driven port / secondary port). */
export interface IWalletRepository {
  /** Persists a new or updated wallet. */
  save(wallet: Wallet): Promise<void>;
  /** Returns the wallet owned by the given player, or `null` if none exists. */
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  /** Returns the wallet with the given id, or `null` if none exists. */
  findById(id: string): Promise<Wallet | null>;
}
