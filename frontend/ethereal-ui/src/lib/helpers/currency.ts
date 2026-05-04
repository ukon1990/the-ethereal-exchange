import { CurrencyAmount } from '../models/ui-models';

export function copperToCurrencyAmount(copper: number | null | undefined): CurrencyAmount {
  if (copper == null || !Number.isFinite(copper)) return {};
  const value = Math.max(0, Math.round(copper));
  return {
    gold: Math.floor(value / 10_000) || undefined,
    silver: Math.floor((value % 10_000) / 100) || undefined,
    copper: value % 100 || undefined,
  };
}

export function hasCurrencyValue(
  amount: CurrencyAmount | null | undefined,
): amount is CurrencyAmount {
  return Boolean(amount?.gold || amount?.silver || amount?.copper);
}

export function formatCurrencyPart(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString('en-US');
}

export function formatCurrencyAmount(amount: CurrencyAmount | null | undefined): string {
  if (!hasCurrencyValue(amount)) return '—';
  return [
    amount.gold ? `${formatCurrencyPart(amount.gold)}g` : '',
    amount.silver ? `${formatCurrencyPart(amount.silver)}s` : '',
    amount.copper ? `${formatCurrencyPart(amount.copper)}c` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function formatCopperCurrency(copper: number | null | undefined): string {
  return formatCurrencyAmount(copperToCurrencyAmount(copper));
}
