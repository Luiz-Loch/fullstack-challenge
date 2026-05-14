import { describe, it, expect, mock } from 'bun:test'
import { ConflictException } from '@nestjs/common'
import { CreateWalletUseCase } from '../../../src/application/use-cases/create-wallet.use-case'
import { Wallet } from '../../../src/domain/wallet.aggregate'
import type { IWalletRepository } from '../../../src/domain/ports/wallet.repository'

const makeSut = (existing: Wallet | null = null) => {
  const save = mock(() => Promise.resolve())
  const findByPlayerId = mock(() => Promise.resolve(existing))
  const repo = {
    save,
    findByPlayerId,
    findById: mock(() => Promise.resolve(null)),
  } as unknown as IWalletRepository

  return { useCase: new CreateWalletUseCase(repo), save, findByPlayerId }
}

describe('CreateWalletUseCase', () => {
  describe('when player has no wallet', () => {
    it('returns a wallet with the correct playerId', async () => {
      const { useCase } = makeSut()
      const wallet = await useCase.execute('player-1')
      expect(wallet.playerId).toBe('player-1')
    })

    it('returns a wallet with zero balance', async () => {
      const { useCase } = makeSut()
      const wallet = await useCase.execute('player-1')
      expect(wallet.balance.amount).toBe(0n)
    })

    it('saves the wallet to the repository', async () => {
      const { useCase, save } = makeSut()
      await useCase.execute('player-1')
      expect(save).toHaveBeenCalledTimes(1)
    })
  })

  describe('when player already has a wallet', () => {
    it('throws ConflictException', async () => {
      const existing = Wallet.reconstitute('id-1', 'player-1', 0n)
      const { useCase } = makeSut(existing)
      await expect(useCase.execute('player-1')).rejects.toThrow(ConflictException)
    })

    it('does not call save', async () => {
      const existing = Wallet.reconstitute('id-1', 'player-1', 0n)
      const { useCase, save } = makeSut(existing)
      await useCase.execute('player-1').catch(() => {})
      expect(save).not.toHaveBeenCalled()
    })
  })
})
