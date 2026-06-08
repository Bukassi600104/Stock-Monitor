import { documents, holdings, portfolio, stocks, transactions } from "./data";
import type { DocumentRecord, Holding, Stock, Transaction } from "./types";

export type HoldingDetail = {
  holding: Holding;
  stock: Stock | null;
  position: {
    totalCost: number;
    currentValue: number;
    unrealizedGain: number;
    unrealizedGainPercent: number;
    portfolioWeightPercent: number;
    yieldOnCost: number;
  };
  transactions: Transaction[];
  documents: DocumentRecord[];
  aiReview: {
    label: "Still fits strategy" | "Monitor" | "Review";
    summary: string;
    facts: string[];
    risks: string[];
  };
};

export function getHoldingDetail(holdingIdOrSymbol: string): HoldingDetail | null {
  const key = holdingIdOrSymbol.trim().toUpperCase();
  const holding = holdings.find((item) => item.id.toUpperCase() === key || item.symbol === key);

  if (!holding) return null;

  const stock = stocks.find((item) => item.symbol === holding.symbol) ?? null;
  const totalCost = roundMoney(holding.quantity * holding.averagePrice);
  const currentValue = roundMoney(holding.quantity * holding.currentPrice);
  const unrealizedGain = roundMoney(currentValue - totalCost);
  const unrealizedGainPercent = totalCost ? roundPercent((unrealizedGain / totalCost) * 100) : 0;
  const portfolioWeightPercent = portfolio.value ? roundPercent((currentValue / portfolio.value) * 100) : 0;
  const yieldOnCost = totalCost ? roundPercent((holding.expectedAnnualDividend / totalCost) * 100) : 0;
  const relatedTransactions = transactions.filter((transaction) => transaction.symbol === holding.symbol);
  const relatedDocuments = documents.filter((document) => document.relatedStock === holding.symbol || document.title.toUpperCase().includes(holding.symbol));

  return {
    holding,
    stock,
    position: {
      totalCost,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent,
      portfolioWeightPercent,
      yieldOnCost,
    },
    transactions: relatedTransactions,
    documents: relatedDocuments,
    aiReview: buildAiReview(holding, stock, portfolioWeightPercent),
  };
}

function buildAiReview(holding: Holding, stock: Stock | null, portfolioWeightPercent: number): HoldingDetail["aiReview"] {
  const label = stock && stock.opportunityScore < 60 ? "Review" : portfolioWeightPercent > 25 || holding.riskLevel !== "Low" ? "Monitor" : "Still fits strategy";
  const facts = [
    `${holding.symbol} is ${portfolioWeightPercent.toFixed(2)}% of the current portfolio value.`,
    `Expected annual dividend is NGN ${holding.expectedAnnualDividend.toLocaleString("en-NG")}.`,
    stock ? `Scanner scores: opportunity ${stock.opportunityScore}/100, dividend ${stock.dividendScore}/100, valuation ${stock.valuationScore}/100, liquidity ${stock.liquidityScore}/100.` : "No linked market scanner score is available for this holding.",
  ];
  const risks = [
    ...(stock?.risks ?? ["Market risk notes are missing until stock data is imported."]),
    ...(portfolioWeightPercent > 25 ? ["Single-stock concentration is above the 25% review threshold from the portfolio rules."] : []),
  ];

  return {
    label,
    summary: `${holding.symbol} ${label === "Still fits strategy" ? "still fits the dividend strategy" : "needs monitoring"} based on the available local portfolio and scanner data. The app explains the position and does not place trades; any buy, sell, or add-more decision remains manual through Stanbic IBTC.`,
    facts,
    risks,
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}
