import { alerts, dataSource, holdings, lastUpdated, portfolio, stocks } from "./data";
import { formatCompactNaira, formatNaira } from "./scoring";
import type { Holding, Stock } from "./types";

export type AssistantIntent = "stock-comparison" | "portfolio-risk" | "holding-review" | "market-briefing" | "unknown";
export type AssistantLabel = "Review" | "Monitor" | "Still fits strategy" | "Needs data";

export type AssistantAnswer = {
  intent: AssistantIntent;
  answer: string;
  facts: string[];
  interpretation: string[];
  risks: string[];
  suggestedLabel: AssistantLabel;
  dataStatus: string;
  guardrails: string[];
  comparedSymbols: string[];
};

const guardrails = [
  "Uses available local market, portfolio, watchlist, and alert data only.",
  "Does not issue direct buy or sell instructions.",
  "Trades, account actions, and broker decisions remain manual through the user's broker workflow.",
];

const symbolAliases: Record<string, string> = {
  ZENITH: "ZENITHBANK",
  ZENITHBANK: "ZENITHBANK",
  "ZENITH BANK": "ZENITHBANK",
  GTCO: "GTCO",
  UBA: "UBA",
  MTNN: "MTNN",
  MTN: "MTNN",
  BUA: "BUAFOODS",
  BUAFOODS: "BUAFOODS",
  "BUA FOODS": "BUAFOODS",
  DANGCEM: "DANGCEM",
  DANGOTE: "DANGCEM",
  SEPLAT: "SEPLAT",
  NESTLE: "NESTLE",
  OANDO: "OANDO",
};

export function answerAssistant(rawQuestion: string): AssistantAnswer {
  const question = rawQuestion.trim() || "Give me a local portfolio and market briefing.";
  const normalized = normalize(question);
  const requestedStocks = extractRequestedStocks(normalized);

  if (requestedStocks.length >= 2 || normalized.includes("COMPARE")) {
    return compareStocks(question, requestedStocks.length >= 2 ? requestedStocks : stocks.slice(0, 3));
  }

  if (normalized.includes("OVEREXPOSED") || normalized.includes("CONCENTRATION") || normalized.includes("BANKING") || normalized.includes("ALLOCATION")) {
    return portfolioRisk();
  }

  if (normalized.includes("HOLDING") || normalized.includes("ATTENTION") || normalized.includes("REVIEW") || normalized.includes("PORTFOLIO")) {
    return holdingReview();
  }

  if (normalized.includes("MARKET") || normalized.includes("BRIEF") || normalized.includes("SECTOR") || normalized.includes("DIVIDEND")) {
    return marketBriefing();
  }

  if (requestedStocks.length === 1) {
    return compareStocks(question, requestedStocks);
  }

  return unknown(question);
}

function compareStocks(question: string, requestedStocks: Stock[]): AssistantAnswer {
  const uniqueStocks = uniqueBySymbol(requestedStocks);
  const missingTerms = extractMissingStockTerms(question, uniqueStocks);
  const best = [...uniqueStocks].sort((left, right) => right.opportunityScore - left.opportunityScore)[0];
  const comparedSymbols = uniqueStocks.map((stock) => stock.symbol);

  return {
    intent: comparedSymbols.length > 1 ? "stock-comparison" : "holding-review",
    comparedSymbols,
    suggestedLabel: best?.riskLevel === "Low" ? "Still fits strategy" : "Review",
    dataStatus: freshnessLine(),
    guardrails,
    answer: comparedSymbols.length
      ? `${comparedSymbols.join(", ")} are available in the local snapshot. ${best.symbol} leads this set on opportunity score, while the final decision still needs manual research because current prices and dividend inputs are delayed local data.`
      : "I could not match those stocks to the local NGX snapshot, so I cannot compare them without new data.",
    facts: uniqueStocks.flatMap((stock) => [
      `${stock.symbol}: opportunity ${stock.opportunityScore}/100, dividend ${stock.dividendScore}/100, valuation ${stock.valuationScore}/100, liquidity ${stock.liquidityScore}/100, risk ${stock.riskLevel}.`,
      `${stock.symbol}: price ${formatNaira(stock.price)}, dividend yield ${stock.dividendYield.toFixed(2)}%, P/E ${stock.pe || "n/a"}, ROE ${stock.roe}%.`,
    ]),
    interpretation: uniqueStocks.map((stock) => `${stock.symbol}: ${stock.reason}`),
    risks: [
      ...uniqueStrings(uniqueStocks.flatMap((stock) => stock.risks)),
      ...(uniqueStocks.filter((stock) => stock.sector === "Banking").length > 1 ? ["Banking concentration matters because multiple compared names share the same sector driver."] : []),
      ...missingTerms.map((term) => `${term} is not available in the local snapshot and was not used.`),
    ],
  };
}

function portfolioRisk(): AssistantAnswer {
  const allocations = sectorAllocations();
  const largest = allocations[0];
  const concentrationAlert = alerts.find((alert) => alert.title === "Concentration Risk");
  const label: AssistantLabel = largest.percent >= 50 ? "Review" : largest.percent >= 40 ? "Monitor" : "Still fits strategy";

  return {
    intent: "portfolio-risk",
    comparedSymbols: [],
    suggestedLabel: label,
    dataStatus: freshnessLine(),
    guardrails,
    answer: `${largest.sector} is the largest allocation at ${largest.percent.toFixed(1)}% of current portfolio value. That is near the app's review zone, so the portfolio deserves monitoring before adding more names from the same sector.`,
    facts: [
      `Portfolio value is ${formatCompactNaira(portfolio.value)} with ${portfolio.gainPercent.toFixed(1)}% unrealized gain/loss.`,
      `${largest.sector} exposure is ${largest.percent.toFixed(1)}% of current value across ${largest.count} holding${largest.count === 1 ? "" : "s"}.`,
      concentrationAlert ? concentrationAlert.detail : "No concentration alert is currently recorded.",
    ],
    interpretation: [
      `${largest.sector} still contributes strong income visibility, but new additions should be checked against diversification goals.`,
      "MTNN and BUAFOODS provide some non-bank exposure, which helps reduce single-sector dependence.",
    ],
    risks: [
      "A sector shock can affect several holdings at once when allocation is concentrated.",
      "Dividend income depends heavily on tier-one banking holdings in the current portfolio.",
      "This uses local portfolio values only; live broker balances are not connected.",
    ],
  };
}

function holdingReview(): AssistantAnswer {
  const reviewed = holdings
    .map((holding) => ({ holding, stock: stocks.find((stock) => stock.symbol === holding.symbol), value: holding.quantity * holding.currentPrice }))
    .sort((left, right) => (right.stock?.riskScore ?? 0) - (left.stock?.riskScore ?? 0));
  const top = reviewed[0];

  return {
    intent: "holding-review",
    comparedSymbols: top.stock ? [top.stock.symbol] : [],
    suggestedLabel: top.stock && top.stock.riskScore >= 45 ? "Review" : "Monitor",
    dataStatus: freshnessLine(),
    guardrails,
    answer: `${top.holding.symbol} is the holding that most needs review in the current local portfolio, mainly because its valuation and risk profile are less forgiving than the bank core holdings.`,
    facts: [
      `${top.holding.symbol}: current value ${formatCompactNaira(top.value)}, average price ${formatNaira(top.holding.averagePrice)}, current price ${formatNaira(top.holding.currentPrice)}.`,
      top.stock ? `${top.stock.symbol}: opportunity ${top.stock.opportunityScore}/100, risk score ${top.stock.riskScore}/100, dividend yield ${top.stock.dividendYield.toFixed(2)}%.` : `${top.holding.symbol}: no matching stock score is available.`,
      `Expected annual dividend for this holding is ${formatCompactNaira(top.holding.expectedAnnualDividend)}.`,
    ],
    interpretation: [
      top.holding.thesis,
      top.stock?.reason ?? "The position can only be reviewed from portfolio records until market metrics are imported.",
    ],
    risks: top.stock?.risks ?? ["Missing market score data for this holding."],
  };
}

function marketBriefing(): AssistantAnswer {
  const leaders = [...stocks].sort((left, right) => right.opportunityScore - left.opportunityScore).slice(0, 3);
  const riskNames = stocks.filter((stock) => stock.riskLevel === "High" || stock.riskLevel === "Elevated").map((stock) => stock.symbol);

  return {
    intent: "market-briefing",
    comparedSymbols: leaders.map((stock) => stock.symbol),
    suggestedLabel: "Monitor",
    dataStatus: freshnessLine(),
    guardrails,
    answer: `The local scan favors ${leaders.map((stock) => stock.symbol).join(", ")} for dividend research, with Banking and Telecom/ICT showing the clearest current support. Treat this as research intelligence, not a trade instruction.`,
    facts: leaders.map((stock) => `${stock.symbol}: opportunity ${stock.opportunityScore}/100, dividend ${stock.dividendScore}/100, yield ${stock.dividendYield.toFixed(2)}%, liquidity ${stock.liquidityScore}/100.`),
    interpretation: [
      "High scores are coming from dividend visibility, valuation, liquidity, and lower risk scores rather than a single raw yield.",
      "Consumer Goods is mixed: BUAFOODS has quality signals, while valuation discipline remains important.",
    ],
    risks: [
      `${riskNames.join(", ")} carry elevated or high risk labels in the current scan.`,
      "The snapshot is delayed and local; live prices, corporate actions, and broker data may differ.",
    ],
  };
}

function unknown(question: string): AssistantAnswer {
  const requestedStocks = extractRequestedStocks(normalize(question));

  return {
    intent: "unknown",
    comparedSymbols: requestedStocks.map((stock) => stock.symbol),
    suggestedLabel: "Needs data",
    dataStatus: freshnessLine(),
    guardrails,
    answer: "That exact request is not available from the local dataset. I can explain current holdings, compare scanned NGX names, summarize portfolio risk, or generate a market/dividend briefing from imported data.",
    facts: [
      `Available stock symbols: ${stocks.map((stock) => stock.symbol).join(", ")}.`,
      `Available holdings: ${holdings.map((holding) => holding.symbol).join(", ")}.`,
    ],
    interpretation: [
      "The assistant should not invent broker positions, live prices, undisclosed dividends, or missing company records.",
      "Try asking for a comparison, portfolio concentration check, holding review, or dividend-market briefing.",
    ],
    risks: [
      "Missing or unimported securities cannot be evaluated reliably.",
      "The assistant cannot answer buy/sell timing questions from this local snapshot.",
    ],
  };
}

function extractRequestedStocks(normalizedQuestion: string) {
  const matches = new Map<string, Stock>();

  for (const [alias, symbol] of Object.entries(symbolAliases)) {
    if (normalizedQuestion.includes(alias)) {
      const stock = stocks.find((item) => item.symbol === symbol);
      if (stock) matches.set(stock.symbol, stock);
    }
  }

  return Array.from(matches.values()).sort(
    (left, right) => stocks.findIndex((stock) => stock.symbol === left.symbol) - stocks.findIndex((stock) => stock.symbol === right.symbol),
  );
}

function extractMissingStockTerms(question: string, matchedStocks: Stock[]) {
  const knownSymbols = new Set(matchedStocks.map((stock) => stock.symbol));
  return question
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((term) => term.length >= 3)
    .filter((term) => !["COMPARE", "WITH", "AND", "FOR", "THE", "DIVIDEND", "PORTFOLIO", "TODAY"].includes(term))
    .filter((term) => !Object.keys(symbolAliases).includes(term))
    .filter((term) => !knownSymbols.has(term));
}

function sectorAllocations() {
  const totals = holdings.reduce<Record<string, { sector: string; value: number; count: number }>>((acc, holding) => {
    acc[holding.sector] ??= { sector: holding.sector, value: 0, count: 0 };
    acc[holding.sector].value += holdingValue(holding);
    acc[holding.sector].count += 1;
    return acc;
  }, {});

  return Object.values(totals)
    .map((item) => ({ ...item, percent: portfolio.value ? (item.value / portfolio.value) * 100 : 0 }))
    .sort((left, right) => right.percent - left.percent);
}

function holdingValue(holding: Holding) {
  return holding.quantity * holding.currentPrice;
}

function uniqueBySymbol(items: Stock[]) {
  return Array.from(new Map(items.map((item) => [item.symbol, item])).values());
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items));
}

function freshnessLine() {
  return `Data status: ${dataSource}. Last updated ${lastUpdated}. Current prices, dividends, and broker balances may be stale until refreshed or imported.`;
}

function normalize(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}
