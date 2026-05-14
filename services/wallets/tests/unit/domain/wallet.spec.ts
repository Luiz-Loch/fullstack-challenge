import { describe, it, expect } from 'bun:test'
import { Wallet } from '../../../src/domain/wallet.aggregate'
import { Money } from '../../../src/domain/value-objects/money.vo'
import { WalletCreated } from '../../../src/domain/events/wallet-created.event'
import { BalanceCredited } from '../../../src/domain/events/balance-credited.event'
import { BalanceDebited } from '../../../src/domain/events/balance-debited.event'

describe('Wallet', () => {
  describe('create()', () => {
    it('creates a wallet with zero balance', () => {
      const wallet = Wallet.create('player-1')
      expect(wallet.balance.amount).toBe(0n)
    })

    it('assigns the given playerId', () => {
      const wallet = Wallet.create('player-1')
      expect(wallet.playerId).toBe('player-1')
    })

    it('generates a unique id', () => {
      const a = Wallet.create('player-1')
      const b = Wallet.create('player-1')
      expect(a.id).not.toBe(b.id)
    })

    it('emits a WalletCreated event', () => {
      const wallet = Wallet.create('player-1')
      const events = wallet.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(WalletCreated)
      expect((events[0] as WalletCreated).playerId).toBe('player-1')
    })
  })

  describe('reconstitute()', () => {
    it('restores balance from persisted cents', () => {
      const wallet = Wallet.reconstitute('id-1', 'player-1', 5000n)
      expect(wallet.balance.amount).toBe(5000n)
    })

    it('does not emit any events', () => {
      const wallet = Wallet.reconstitute('id-1', 'player-1', 5000n)
      expect(wallet.domainEvents).toHaveLength(0)
    })
  })

  describe('credit()', () => {
    it('increases the balance by the given amount', () => {
      const wallet = Wallet.create('player-1')
      wallet.credit(Money.of(1000n))
      expect(wallet.balance.amount).toBe(1000n)
    })

    it('emits a BalanceCredited event', () => {
      const wallet = Wallet.create('player-1')
      wallet.credit(Money.of(1000n))
      const event = wallet.domainEvents[1] as BalanceCredited
      expect(event).toBeInstanceOf(BalanceCredited)
      expect(event.amount).toBe(1000n)
    })
  })

  describe('debit()', () => {
    it('decreases the balance by the given amount', () => {
      const wallet = Wallet.create('player-1')
      wallet.credit(Money.of(1000n))
      wallet.debit(Money.of(400n))
      expect(wallet.balance.amount).toBe(600n)
    })

    it('emits a BalanceDebited event', () => {
      const wallet = Wallet.create('player-1')
      wallet.credit(Money.of(1000n))
      wallet.debit(Money.of(400n))
      const event = wallet.domainEvents[2] as BalanceDebited
      expect(event).toBeInstanceOf(BalanceDebited)
      expect(event.amount).toBe(400n)
    })

    it('throws when balance is insufficient', () => {
      const wallet = Wallet.create('player-1')
      wallet.credit(Money.of(500n))
      expect(() => wallet.debit(Money.of(600n))).toThrow('Insufficient balance')
    })

    it('allows debiting the exact balance', () => {
      const wallet = Wallet.create('player-1')
      wallet.credit(Money.of(500n))
      wallet.debit(Money.of(500n))
      expect(wallet.balance.amount).toBe(0n)
    })
  })

  describe('domainEvents', () => {
    it('returns a copy — mutating it does not affect internal state', () => {
      const wallet = Wallet.create('player-1')
      wallet.domainEvents.push(null as any)
      expect(wallet.domainEvents).toHaveLength(1)
    })
  })

  describe('clearEvents()', () => {
    it('removes all pending events', () => {
      const wallet = Wallet.create('player-1')
      wallet.credit(Money.of(1000n))
      wallet.clearEvents()
      expect(wallet.domainEvents).toHaveLength(0)
    })
  })

})
