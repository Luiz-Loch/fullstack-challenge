import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import type { Request } from 'express';

/** Express request enriched with the authenticated player's id after JWT validation. */
export interface AuthenticatedRequest
    extends Request {
  playerId: string;
}

/**
 * NestJS guard that validates Keycloak-issued JWTs using RS256 + JWKS.
 *
 * On success, attaches `request.playerId` (the token's `sub` claim) so handlers
 * can retrieve it via the {@link PlayerId} decorator.
 */
@Injectable()
export class KeycloakJwtGuard
    implements CanActivate {

  private readonly logger = new Logger(KeycloakJwtGuard.name);
  private readonly jwksClient: jwksRsa.JwksClient;

  constructor(private readonly config: ConfigService) {
    this.jwksClient = jwksRsa({
      jwksUri: this.config.getOrThrow<string>('KEYCLOAK_JWKS_URI'),
      cache: true,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('Request rejected: missing Bearer token');
      throw new UnauthorizedException('Missing Bearer token');
    }

    const payload = await this.verifyToken(token).catch((err: Error) => {
      this.logger.warn(`Request rejected: ${err.message}`);
      throw new UnauthorizedException('Invalid token');
    });

    if (!payload.sub) {
      this.logger.warn('Request rejected: token missing sub claim');
      throw new UnauthorizedException('Token missing sub claim');
    }

    request.playerId = payload.sub;
    return true;
  }

  /** Extracts the raw JWT from the `Authorization: Bearer <token>` header. */
  private extractToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return undefined;
    return auth.slice(7);
  }

  /**
   * Fetches the signing key from Keycloak's JWKS endpoint and verifies the token signature.
   * Uses the `kid` from the token header to select the correct key.
   */
  private verifyToken(token: string): Promise<jwt.JwtPayload> {
    return new Promise((resolve, reject) => {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded?.header?.kid) return reject(new Error('Missing kid in token header'));

      this.jwksClient.getSigningKey(decoded.header.kid, (err, key) => {
        if (err || !key) return reject(err ?? new Error('Signing key not found'));
        jwt.verify(token, key.getPublicKey(), { algorithms: ['RS256'] }, (verifyErr, payload) => {
          if (verifyErr || !payload) return reject(verifyErr);
          resolve(payload as jwt.JwtPayload);
        });
      });
    });
  }
}
