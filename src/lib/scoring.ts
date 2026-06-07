import type { RiskLevel, Stock } from "./types";

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function classifyRisk(score: number): RiskLevel {
  if (score >= 75) return "High";
  if (score >= 55) return "Elevated";
  if (score >= 35) return "Moderate";
  return "Low";
}

export function calculateOpportunityScore(stock: Pick<Stock, "dividendScore" | "valuationScore" | "liquidityScore" | "riskScore" | "roe">) {
  const quality = stock.roe * 0.8;
  const riskAdjustment = 100 - stock.riskScore;
  return clampScore(
    stock.dividendScore * 0.3 +
      stock.valuationScore * 0.24 +
      stock.liquidityScore * 0.16 +
      quality * 0.14 +
      riskAdjustment * 0.16,
  );
}

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: value >= 1000000 ? 1 : 2,
  }).format(value);
}

export function formatCompactNaira(value: number) {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  return formatNaira(value);
}

export function portfolioMetrics(holdings: StockPortfolioInput[]) {
  const invested = holdings.reduce((sum, item) => sum + item.quantity * item.averagePrice, 0);
  const value = holdings.reduce((sum, item) => sum + item.quantity * item.currentPrice, 0);
  const dividends = holdings.reduce((sum, item) => sum + item.dividendsReceived, 0);
  const expected = holdings.reduce((sum, item) => sum + item.expectedAnnualDividend, 0);

  return {
    invested,
    value,
    gain: value - invested,
    gainPercent: invested ? ((value - invested) / invested) * 100 : 0,
    dividends,
    expected,
    yieldOnCost: invested ? (expected / invested) * 100 : 0,
  };
}

type StockPortfolioInput = {
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  dividendsReceived: number;
  expectedAnnualDividend: number;
};
