import { describe, it, expect } from 'bun:test';
import { ProvablyFair } from '../../../src/domain/provably-fair';
import { Multiplier } from '../../../src/domain/value-objects/multiplier.vo';

describe('ProvablyFair', () => {
  describe('generateServerSeed()', () => {
    it('returns a 64-char hex string (32 bytes)', () => {
      const seed = ProvablyFair.generateServerSeed();
      expect(seed).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns a different value on each call', () => {
      expect(ProvablyFair.generateServerSeed()).not.toBe(ProvablyFair.generateServerSeed());
    });
  });

  describe('computeCommitment()', () => {
    it('returns a 64-char hex string (SHA256 output)', () => {
      const commitment = ProvablyFair.computeCommitment('any-seed');
      expect(commitment).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic — same seed always produces the same commitment', () => {
      const seed = 'fixed-seed';
      expect(ProvablyFair.computeCommitment(seed)).toBe(ProvablyFair.computeCommitment(seed));
    });

    it('produces different commitments for different seeds', () => {
      expect(ProvablyFair.computeCommitment('seed-a')).not.toBe(ProvablyFair.computeCommitment('seed-b'));
    });
  });

  describe('generateCrashPoint()', () => {
    it('is deterministic — same inputs always produce the same crash point', () => {
      const serverSeed = 'server-seed-fixed';
      const clientSeed = 'client-seed-fixed';
      const a = ProvablyFair.generateCrashPoint(serverSeed, clientSeed);
      const b = ProvablyFair.generateCrashPoint(serverSeed, clientSeed);
      expect(a.centesimals).toBe(b.centesimals);
    });

    it('always returns a crash point >= 1.00x (100 centesimals)', () => {
      for (let i = 0; i < 10_000; i++) {
        const cp = ProvablyFair.generateCrashPoint(
          ProvablyFair.generateServerSeed(),
          `client-${i}`,
        );
        expect(cp.centesimals).toBeGreaterThanOrEqual(100n);
      }
    });

    it('produces different crash points for different server seeds', () => {
      const clientSeed = 'same-client';
      const a = ProvablyFair.generateCrashPoint('server-seed-1', clientSeed);
      const b = ProvablyFair.generateCrashPoint('server-seed-2', clientSeed);
      expect(a.centesimals).not.toBe(b.centesimals);
    });

    it('produces different crash points for different client seeds', () => {
      const serverSeed = 'same-server';
      const a = ProvablyFair.generateCrashPoint(serverSeed, 'client-seed-1');
      const b = ProvablyFair.generateCrashPoint(serverSeed, 'client-seed-2');
      expect(a.centesimals).not.toBe(b.centesimals);
    });
  });

  describe('verify()', () => {
    it('returns true when all inputs are correct', () => {
      const serverSeed = ProvablyFair.generateServerSeed();
      const clientSeed = 'round-uuid-xyz';
      const commitment = ProvablyFair.computeCommitment(serverSeed);
      const crashPoint = ProvablyFair.generateCrashPoint(serverSeed, clientSeed);

      expect(ProvablyFair.verify(serverSeed, clientSeed, commitment, crashPoint)).toBe(true);
    });

    it('returns false when serverSeed does not match commitment', () => {
      const serverSeed = ProvablyFair.generateServerSeed();
      const clientSeed = 'round-uuid-xyz';
      const wrongCommitment = ProvablyFair.computeCommitment('different-seed');
      const crashPoint = ProvablyFair.generateCrashPoint(serverSeed, clientSeed);

      expect(ProvablyFair.verify(serverSeed, clientSeed, wrongCommitment, crashPoint)).toBe(false);
    });

    it('returns false when claimedCrashPoint does not match the computed one', () => {
      const serverSeed = ProvablyFair.generateServerSeed();
      const clientSeed = 'round-uuid-xyz';
      const commitment = ProvablyFair.computeCommitment(serverSeed);
      const wrongCrashPoint = Multiplier.of(999n);

      expect(ProvablyFair.verify(serverSeed, clientSeed, commitment, wrongCrashPoint)).toBe(false);
    });

    it('returns false when clientSeed is different from the one used to generate the crash point', () => {
      const serverSeed = ProvablyFair.generateServerSeed();
      const commitment = ProvablyFair.computeCommitment(serverSeed);
      const crashPoint = ProvablyFair.generateCrashPoint(serverSeed, 'original-client');

      expect(ProvablyFair.verify(serverSeed, 'tampered-client', commitment, crashPoint)).toBe(false);
    });
  });

  describe('house edge', () => {
    it('all crash points across 500 rounds are >= 1.00x', () => {
      for (let i = 0; i < 500; i++) {
        const cp = ProvablyFair.generateCrashPoint(
          ProvablyFair.generateServerSeed(),
          `round-${i}`,
        );
        expect(cp.centesimals).toBeGreaterThanOrEqual(100n);
      }
    });

    it('approximately 2% of rounds crash at exactly 1.00x (house edge floor)', () => {
      const ROUNDS = 10_000;
      let crashedAtMin = 0;

      for (let i = 0; i < ROUNDS; i++) {
        const cp = ProvablyFair.generateCrashPoint(
          ProvablyFair.generateServerSeed(),
          `round-${i}`,
        );
        if (cp.centesimals === 100n) crashedAtMin++;
      }

      const rate = crashedAtMin / ROUNDS;
      // floor() maps raw values in [1.00, 1.01[ to 100 centesimals,
      // so the clamp hits ~2% of rounds (h < MAX × 2/101 ≈ 1.98%), not 1%.
      // Allow ±1% margin for statistical variance.
      expect(rate).toBeGreaterThan(0.01);
      expect(rate).toBeLessThan(0.03);
    });
  });
});
