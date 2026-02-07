import { describe, it, expect } from 'vitest';
import { parseCurrency, formatCurrency, calcRunwayMonths } from '@/lib/currencyUtils';

describe('parseCurrency', () => {
  it('parses $4.2M correctly', () => {
    expect(parseCurrency('$4.2M')).toBe(4_200_000);
  });
  it('parses $650K correctly', () => {
    expect(parseCurrency('$650K')).toBe(650_000);
  });
  it('parses $1.1M correctly', () => {
    expect(parseCurrency('$1.1M')).toBe(1_100_000);
  });
  it('parses $3.2M correctly', () => {
    expect(parseCurrency('$3.2M')).toBe(3_200_000);
  });
  it('parses $1.4M correctly', () => {
    expect(parseCurrency('$1.4M')).toBe(1_400_000);
  });
  it('parses $42M correctly', () => {
    expect(parseCurrency('$42M')).toBe(42_000_000);
  });
  it('parses $25M correctly', () => {
    expect(parseCurrency('$25M')).toBe(25_000_000);
  });
  it('parses $2.8M correctly', () => {
    expect(parseCurrency('$2.8M')).toBe(2_800_000);
  });
  it('handles empty/null', () => {
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency(null)).toBe(0);
    expect(parseCurrency(undefined)).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats millions correctly', () => {
    expect(formatCurrency(13_200_000)).toBe('$13.2M');
    expect(formatCurrency(16_800_000)).toBe('$16.8M');
    expect(formatCurrency(7_800_000)).toBe('$7.8M');
    expect(formatCurrency(42_000_000)).toBe('$42M');
  });
  it('formats thousands correctly', () => {
    expect(formatCurrency(650_000)).toBe('$650K');
    expect(formatCurrency(500_000)).toBe('$500K');
  });
});

describe('calcRunwayMonths — all 6 demo scenarios', () => {
  it('Manufacturing Turnaround: $4.2M / $650K = 6.5 months', () => {
    const runway = calcRunwayMonths('$4.2M', '$650K');
    expect(runway).toBeCloseTo(6.46, 1);
  });
  it('Tech Acquisition: $18M / $1.2M = 15 months', () => {
    const runway = calcRunwayMonths('$18M', '$1.2M');
    expect(runway).toBeCloseTo(15, 0);
  });
  it('Retail Liquidity Crisis: $2.8M / $1.1M = 2.5 months', () => {
    const runway = calcRunwayMonths('$2.8M', '$1.1M');
    expect(runway).toBeCloseTo(2.55, 1);
  });
  it('Covenant Breach Risk: $3.2M / $1.4M = 2.3 months', () => {
    const runway = calcRunwayMonths('$3.2M', '$1.4M');
    expect(runway).toBeCloseTo(2.29, 1);
  });
  it('Customer Concentration: $12M / $1.5M = 8 months', () => {
    const runway = calcRunwayMonths('$12M', '$1.5M');
    expect(runway).toBeCloseTo(8, 0);
  });
  it('Growth vs Profitability: $25M / $1.25M = 20 months', () => {
    const runway = calcRunwayMonths('$25M', '$1.25M');
    expect(runway).toBeCloseTo(20, 0);
  });
});

describe('Annualized burn — all 6 demo scenarios', () => {
  it('Manufacturing Turnaround: $650K × 12 = $7.8M', () => {
    const burn = parseCurrency('$650K');
    expect(formatCurrency(burn * 12)).toBe('$7.8M');
  });
  it('Tech Acquisition: $1.2M × 12 = $14.4M', () => {
    const burn = parseCurrency('$1.2M');
    expect(formatCurrency(burn * 12)).toBe('$14.4M');
  });
  it('Retail Liquidity Crisis: $1.1M × 12 = $13.2M', () => {
    const burn = parseCurrency('$1.1M');
    expect(formatCurrency(burn * 12)).toBe('$13.2M');
  });
  it('Covenant Breach Risk: $1.4M × 12 = $16.8M', () => {
    const burn = parseCurrency('$1.4M');
    expect(formatCurrency(burn * 12)).toBe('$16.8M');
  });
  it('Customer Concentration: $1.5M × 12 = $18M', () => {
    const burn = parseCurrency('$1.5M');
    expect(formatCurrency(burn * 12)).toBe('$18M');
  });
  it('Growth vs Profitability: $1.25M × 12 = $15M', () => {
    const burn = parseCurrency('$1.25M');
    expect(formatCurrency(burn * 12)).toBe('$15M');
  });
});
