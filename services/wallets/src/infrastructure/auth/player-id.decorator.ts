import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './keycloak-jwt.guard';

/**
 * Route parameter decorator that extracts the authenticated player's id
 * from the request, as set by {@link KeycloakJwtGuard}.
 *
 * @example
 * async create(@PlayerId() playerId: string) { ... }
 */
export const PlayerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.playerId;
  },
);
