import { Controller, Get } from "@nestjs/common";
import { HealthCheckResponseDto } from "./dtos/health-check-response.dto";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('games')
@Controller()
export class GamesController {

  constructor() { }

  /** Liveness probe — returns `{ status: "ok" }`. */
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ type: HealthCheckResponseDto })
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'games' };
  }

}
