import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

/** Response returned by the Wallet service for a debit request. */
export interface DebitResponse {
  success: boolean;
  /** Human-readable reason when {@link success} is `false`. */
  message?: string;
}

/** RabbitMQ client for sending commands to the Wallet service. */
@Injectable()
export class WalletClient {
  private readonly client: ClientProxy;

  constructor(configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
        queue: 'wallet_queue',
        queueOptions: { durable: true },
      },
    });
  }

  /**
   * Sends a `bet_placed` command to the Wallet service and waits for the reply.
   * The wallet will debit the player's balance; returns `{ success: false }` on insufficient funds.
   *
   * @param playerId - Keycloak subject (`sub`) of the player placing the bet.
   * @param amountCents - Bet amount in cents.
   */
  async sendBetPlaced(playerId: string, amountCents: bigint): Promise<DebitResponse> {
    return firstValueFrom(
      this.client.send<DebitResponse>('bet_placed', {
        playerId,
        amountCents: amountCents.toString(),
      }),
    );
  }

  /**
   * Emits a `cash_out_won` event to the Wallet service — fire-and-forget.
   * The wallet will credit the player's payout asynchronously.
   *
   * @param playerId - Keycloak subject (`sub`) of the player who cashed out.
   * @param payoutCents - Payout amount in cents (bet × multiplier).
   */
  emitCashOutWon(playerId: string, payoutCents: bigint): void {
    this.client.emit('cash_out_won', {
      playerId,
      payoutCents: payoutCents.toString(),
    }).subscribe();
  }

}