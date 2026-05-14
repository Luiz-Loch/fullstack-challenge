/** Response shape for the `GET /wallets/health` liveness probe. */
export class HealthCheckResponseDto {
  status!: string;
  service!: string;
}
