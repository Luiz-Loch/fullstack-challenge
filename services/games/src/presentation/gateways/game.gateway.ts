import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'games', path: '/games/socket.io', cors: { origin: '*' } })
export class GameGateway {
  @WebSocketServer()
  private readonly server: Server;

  emitRoundBetting(roundId: string, serverSeedHash: string): void {
    this.server.emit('round:betting', { roundId, serverSeedHash });
  }

  emitRoundStarted(roundId: string): void {
    this.server.emit('round:started', { roundId });
  }

  emitMultiplierTick(multiplier: bigint): void {
    this.server.emit('multiplier:tick', { multiplier: multiplier.toString() });
  }

  emitRoundCrashed(crashPoint: bigint, serverSeed: string, clientSeed: string): void {
    this.server.emit('round:crashed', {
      crashPoint: crashPoint.toString(),
      serverSeed,
      clientSeed,
    });
  }

  emitBetPlaced(betId: string, playerId: string, username: string, amountCents: bigint): void {
    this.server.emit('bet:placed', {
      betId,
      playerId,
      username,
      amountCents: amountCents.toString(),
      status: 'PENDING',
    });
  }

  emitBetCashout(
    betId: string,
    playerId: string,
    username: string,
    payoutCents: bigint,
    multiplier: bigint,
  ): void {
    this.server.emit('bet:cashout', {
      betId,
      playerId,
      username,
      payoutCents: payoutCents.toString(),
      multiplier: multiplier.toString(),
    });
  }
}
