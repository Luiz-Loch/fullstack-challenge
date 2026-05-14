import { Wallet } from '../wallet.entity';

export const WALLET_REPOSITORY = Symbol('IWalletRepository');

export interface IWalletRepository {

  save(wallet: Wallet): Promise<void>;
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  findById(id: string): Promise<Wallet | null>;

}
