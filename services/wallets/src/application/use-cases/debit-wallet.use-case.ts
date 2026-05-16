import { Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { type IWalletRepository, WALLET_REPOSITORY } from '@/domain/ports/wallet.repository';
import { Money } from '@/domain/value-objects/money.vo';

export interface DebitWalletCommand {
  playerId: string;
  amountCents: bigint;
}

@Injectable()
export class DebitWalletUseCase {
  private readonly logger = new Logger(DebitWalletUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(command: DebitWalletCommand): Promise<void> {
    const wallet = await this.walletRepository.findByPlayerId(command.playerId);
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for player ${command.playerId}`);
    }

    try {
      wallet.debit(Money.of(command.amountCents));
    } catch {
      throw new UnprocessableEntityException('Insufficient balance');
    }

    await this.walletRepository.save(wallet);
    this.logger.log(`Debited ${command.amountCents} from player=${command.playerId}`);
  }
}