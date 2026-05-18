import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './keycloak-jwt.guard';

/**
 * Route parameter decorator that extracts the authenticated player's username
 * (Keycloak `preferred_username`) from the request, as set by {@link KeycloakJwtGuard}.
 *
 * @example
 * async create(@Username() username: string) { ... }
 */
export const Username = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.username;
  },
);
