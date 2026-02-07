/**
 * Currency parsing and formatting utilities.
 * Handles informal string values like "$4.2M", "$650K", "$1.1M".
 */

/**
 * Parse a currency string with M/K/B suffix into a raw number.
 * e.g. "$4.2M" → 4_200_000, "$650K" → 650_000, "$1.1M" → 1_100_000
 */
export function parseCurrency(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = value.trim();
  const numPart = parseFloat(cleaned.replace(/[^0-9.-]/g, ''));
  if (isNaN(numPart)) return 0;

  const upper = cleaned.toUpperCase();
  if (upper.includes('B')) return numPart * 1_000_000_000;
  if (upper.includes('M')) return numPart * 1_000_000;
  if (upper.includes('K')) return numPart * 1_000;
  return numPart;
}

/**
 * Format a raw number into a human-readable currency string.
 * e.g. 13_200_000 → "$13.2M", 7_800_000 → "$7.8M", 650_000 → "$650K"
 */
export function formatCurrency(value: number, prefix = '$'): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const formatted = (abs / 1_000_000_000);
    return `${sign}${prefix}${stripTrailingZeros(formatted)}B`;
  }
  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000);
    return `${sign}${prefix}${stripTrailingZeros(formatted)}M`;
  }
  if (abs >= 1_000) {
    const formatted = (abs / 1_000);
    return `${sign}${prefix}${stripTrailingZeros(formatted)}K`;
  }
  return `${sign}${prefix}${stripTrailingZeros(abs)}`;
}

function stripTrailingZeros(n: number): string {
  // Show up to 1 decimal place, strip trailing zero
  const fixed = n.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

/**
 * Calculate runway in months from cash and burn strings.
 */
export function calcRunwayMonths(cashStr: string | undefined, burnStr: string | undefined): number {
  const cash = parseCurrency(cashStr);
  const burn = parseCurrency(burnStr);
  if (burn <= 0) return 99;
  return cash / burn;
}
