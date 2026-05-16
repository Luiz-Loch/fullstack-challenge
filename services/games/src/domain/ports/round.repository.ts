import { Round } from '../round.aggregate';

export interface IRoundRepository {
  save(round: Round): Promise<void>;
  findById(id: string): Promise<Round | null>;
  findCurrent(): Promise<Round | null>;
  findHistory(limit: number, offset: number): Promise<{ rounds: Round[]; total: number }>;
}

export const ROUND_REPOSITORY = Symbol('IRoundRepository');
