import { Round } from '../round.aggregate';

export interface IRoundRepository {
  save(round: Round): Promise<void>;
  // findCurrent(): Promise<Round | null>;
  // findById(id: string): Promise<Round | null>;
  // findHistory(limit: number, offset: number): Promise<Round[]>;
}

export const ROUND_REPOSITORY = Symbol('IRoundRepository');
