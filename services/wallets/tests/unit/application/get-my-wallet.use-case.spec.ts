import { describe, it, expect, mock } from 'bun:test'
import { NotFoundException } from '@nestjs/common'
import { GetMyWalletUseCase } from '../../../src/application/use-cases/get-my-wallet.use-case'
import { Wallet } from '../../../src/domain/wallet.entity'
import type { IWalletRepository } from '../../../src/domain/ports/wallet.repository'

const makeSut = (wallet: Wallet | null = null) => {
  const findByPlayerId = mock(() => Promise.resolve(wallet))
  const repo = {
    save: mock(() => Promise.resolve()),
    findByPlayerId,
    findById: mock(() => Promise.resolve(null)),
  } as unknown as IWalletRepository

  return { useCase: new GetMyWalletUseCase(repo), findByPlayerId }
}

describe('GetMyWalletUseCase', () => {
  it('returns the wallet when found', async () => {
    const wallet = Wallet.reconstitute('id-1', 'player-1', 5000n)
    const { useCase } = makeSut(wallet)
    const result = await useCase.execute('player-1')
    expect(result).toBe(wallet)
  })

  it('queries by the given playerId', async () => {
    const wallet = Wallet.reconstitute('id-1', 'player-1', 0n)
    const { useCase, findByPlayerId } = makeSut(wallet)
    await useCase.execute('player-1')
    expect(findByPlayerId).toHaveBeenCalledWith('player-1')
  })

  it('throws NotFoundException when wallet does not exist', async () => {
    const { useCase } = makeSut(null)
    await expect(useCase.execute('player-1')).rejects.toThrow(NotFoundException)
  })
})
