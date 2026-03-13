import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CurrencyFormat {
  currency_symbol: string;
  symbol_first: boolean;
  decimal_digits: number;
  decimal_separator: string;
  group_separator: string;
}

export function formatCurrency(amount: number, fmt: CurrencyFormat | null): string {
  if (!fmt) return amount.toFixed(2);

  const isNegative = amount < 0;
  const fixed = Math.abs(amount).toFixed(fmt.decimal_digits);
  const [intPart, decPart] = fixed.split(".");

  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, fmt.group_separator);
  const numStr =
    fmt.decimal_digits > 0 && decPart
      ? `${grouped}${fmt.decimal_separator}${decPart}`
      : grouped;

  const formatted = fmt.symbol_first
    ? `${fmt.currency_symbol}${numStr}`
    : `${numStr} ${fmt.currency_symbol}`;

  return isNegative ? `-${formatted}` : formatted;
}
