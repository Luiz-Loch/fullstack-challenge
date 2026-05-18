export const BET_MIN_BRL = 1
export const BET_MAX_BRL = 1_000

/** Returns an error message if the bet amount (in R$) is out of range, null otherwise. */
export function validateBetAmount(value: number): string | null {
  if (value < BET_MIN_BRL) return `Mínimo R$ ${BET_MIN_BRL.toFixed(2).replace('.', ',')}`
  if (value > BET_MAX_BRL) return `Máximo R$ ${BET_MAX_BRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  return null
}

/** Returns true if the string value has at most 2 decimal places. */
export function hasTwoDecimalsOrLess(value: string): boolean {
  return /^\d*\.?\d{0,2}$/.test(value)
}
