import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { DebitWalletUseCase } from '@/application/use-cases/debit-wallet.use-case';
import { CreditWalletUseCase } from '@/application/use-cases/credit-wallet.use-case';
import type { BetPlacedPayload } from './payloads/bet-placed.payload';
import type { CashOutWonPayload } from './payloads/cash-out-won.payload';

@Controller()
export class WalletEventsController {
  private readonly logger = new Logger(WalletEventsController.name);

  constructor(
    private readonly debitWallet: DebitWalletUseCase,
    private readonly creditWallet: CreditWalletUseCase,
  ) {}

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

  @EventPattern('cash_out_won')
  async handleCashOutWon(@Payload() data: CashOutWonPayload): Promise<void> {
    this.logger.log(`cash_out_won received: player=${data.playerId} payout=${data.payoutCents}`);
    try {
      await this.creditWallet.execute({
        playerId: data.playerId,
        amountCents: BigInt(data.payoutCents),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Credit failed';
      this.logger.error(`cash_out_won credit failed: player=${data.playerId} reason=${message}`);
    }
  }
}