import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DebitWalletUseCase } from '@/application/use-cases/debit-wallet.use-case';

interface BetPlacedPayload {
  playerId: string;
  amountCents: string;
}

@Controller()
export class WalletEventsController {
  private readonly logger = new Logger(WalletEventsController.name);

  constructor(private readonly debitWallet: DebitWalletUseCase) {}

  @MessagePattern('bet_placed')
  async handleBetPlaced(@Payload() data: BetPlacedPayload): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`bet_placed received: player=${data.playerId} amount=${data.amountCents}`);
    try {
      await this.debitWallet.execute({
        playerId: data.playerId,
        amountCents: BigInt(data.amountCents),
      });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Debit failed';
      this.logger.warn(`bet_placed debit failed: player=${data.playerId} reason=${message}`);
      return { success: false, message };
    }
  }

}