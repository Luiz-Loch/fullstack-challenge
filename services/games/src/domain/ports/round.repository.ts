import { Round } from '../round.aggregate';

export interface IRoundRepository {
  save(round: Round): Promise<void>;
  findById(id: string): Promise<Round | null>;
}

export const ROUND_REPOSITORY = Symbol('IRoundRepository');
