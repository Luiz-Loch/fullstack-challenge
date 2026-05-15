import { Bet } from '../bet.entity';

export interface IBetRepository {
  findByPlayerId(playerId: string, limit: number, offset: number): Promise<{ bets: Bet[]; total: number }>;
}

export const BET_REPOSITORY = Symbol('IBetRepository');
