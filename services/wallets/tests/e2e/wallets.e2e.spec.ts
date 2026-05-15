import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { type CanActivate, type ExecutionContext, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { WalletsController } from '../../src/presentation/controllers/wallets.controller';
import { CreateWalletUseCase } from '../../src/application/use-cases/create-wallet.use-case';
import { GetMyWalletUseCase } from '../../src/application/use-cases/get-my-wallet.use-case';
import { WALLET_REPOSITORY } from '../../src/domain/ports/wallet.repository';
import type { IWalletRepository } from '../../src/domain/ports/wallet.repository';
import { Wallet } from '../../src/domain/wallet.aggregate';
import { KeycloakJwtGuard, type AuthenticatedRequest } from '../../src/infrastructure/auth/keycloak-jwt.guard';

// ---------------------------------------------------------------------------
// In-memory repository — no DB required
// ---------------------------------------------------------------------------

class InMemoryWalletRepository
    implements IWalletRepository {

  private readonly store = new Map<string, Wallet>();

  async save(wallet: Wallet): Promise<void> {
    this.store.set(wallet.id, wallet);
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    for (const wallet of this.store.values()) {
      if (wallet.playerId === playerId) return wallet;
    }
    return null;
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.store.get(id) ?? null;
  }

  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Mock guard — passes if Bearer header is present, rejects otherwise.
// Injects a fixed playerId so tests are deterministic.
// ---------------------------------------------------------------------------

const TEST_PLAYER_ID = 'test-player-id';

class MockJwtGuard
    implements CanActivate {

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    req.playerId = TEST_PLAYER_ID;
    return true;
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Wallets endpoints (e2e)', () => {
  let app: INestApplication;
  let walletRepo: InMemoryWalletRepository;

  beforeAll(async () => {
    walletRepo = new InMemoryWalletRepository();

    const moduleRef = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        CreateWalletUseCase,
        GetMyWalletUseCase,
        { provide: WALLET_REPOSITORY, useValue: walletRepo },
      ],
    })
      .overrideGuard(KeycloakJwtGuard)
      .useValue(new MockJwtGuard())
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    walletRepo.clear();
  });

  // -------------------------------------------------------------------------
  // GET /wallets/health
  // -------------------------------------------------------------------------

  describe('GET /wallets/health', () => {
    it('returns 200 with service status', async () => {
      const res = await request(app.getHttpServer()).get('/wallets/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'wallets' });
    });
  });

  // -------------------------------------------------------------------------
  // POST /wallets
  // -------------------------------------------------------------------------

  describe('POST /wallets', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await request(app.getHttpServer()).post('/wallets');
      expect(res.status).toBe(401);
    });

    it('creates a wallet and returns 201 with balance "0.00"', async () => {
      const res = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(201);
      expect(res.body.playerId).toBe(TEST_PLAYER_ID);
      expect(res.body.balanceCents).toBe('0');
      expect(typeof res.body.id).toBe('string');
    });

    it('returns 409 when the player already has a wallet', async () => {
      await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', 'Bearer test-token');

      const res = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(409);
    });
  });

  // -------------------------------------------------------------------------
  // GET /wallets/me
  // -------------------------------------------------------------------------

  describe('GET /wallets/me', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await request(app.getHttpServer()).get('/wallets/me');
      expect(res.status).toBe(401);
    });

    it('returns 404 when the player has no wallet', async () => {
      const res = await request(app.getHttpServer())
        .get('/wallets/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(404);
    });

    it('returns 200 with wallet and balance after wallet is created', async () => {
      await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', 'Bearer test-token');

      const res = await request(app.getHttpServer())
        .get('/wallets/me')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.playerId).toBe(TEST_PLAYER_ID);
      expect(res.body.balanceCents).toBe('0');
    });
  });
});
