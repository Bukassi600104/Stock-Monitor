import { alerts, aiBriefing, changedItems, holdings, portfolio, sectors, stocks, watchlist } from "./data";
import { formatCompactNaira, formatNaira } from "./scoring";

export type ReportType =
  | "daily-market-briefing"
  | "weekly-watchlist-review"
  | "monthly-dividend-candidates"
  | "portfolio-risk"
  | "sector-rotation"
  | "top-opportunities"
  | "avoid-list"
  | "stock-comparison";

export type ReportFormat = "markdown" | "csv" | "json";

export type ReportDefinition = {
  id: ReportType;
  title: string;
  cadence: "Daily" | "Weekly" | "Monthly" | "On demand";
  description: string;
};

export type GeneratedReport = {
  id: ReportType;
  title: string;
  generatedAt: string;
  summary: string;
  sections: { title: string; lines: string[] }[];
  markdown: string;
  csv: string;
};

export const reportDefinitions: ReportDefinition[] = [
  {
    id: "daily-market-briefing",
    title: "Daily Market Briefing",
    cadence: "Daily",
    description: "Market pulse, top opportunities, risk warnings, and next research tasks.",
  },
  {
    id: "weekly-watchlist-review",
    title: "Weekly Watchlist Review",
    cadence: "Weekly",
    description: "Watchlist movement, target prices, and candidates that need review.",
  },
  {
    id: "monthly-dividend-candidates",
    title: "Monthly Dividend Candidate Report",
    cadence: "Monthly",
    description: "Dividend leaders, payout caution, and sustainable income candidates.",
  },
  {
    id: "portfolio-risk",
    title: "Portfolio Risk Report",
    cadence: "On demand",
    description: "Concentration, dividend dependency, liquidity, and holdings needing review.",
  },
  {
    id: "sector-rotation",
    title: "Sector Rotation Report",
    cadence: "On demand",
    description: "Sector scores, leadership changes, and risk tone by industry group.",
  },
  {
    id: "top-opportunities",
    title: "Top 20 Opportunities Report",
    cadence: "On demand",
    description: "Highest-scoring research candidates with dividend and risk evidence.",
  },
  {
    id: "avoid-list",
    title: "Avoid List Report",
    cadence: "On demand",
    description: "Low-score or high-risk names to avoid until the evidence changes.",
  },
  {
    id: "stock-comparison",
    title: "Stock Comparison Report",
    cadence: "On demand",
    description: "Compare GTCO, Zenith Bank, UBA, MTNN, and other candidates side by side.",
  },
];

export function generateReport(type: ReportType = "daily-market-briefing"): GeneratedReport {
  const definition = reportDefinitions.find((report) => report.id === type) ?? reportDefinitions[0];
  const generatedAt = "June 8, 2026 00:00 WAT";
  const topOpportunities = [...stocks].sort((left, right) => right.opportunityScore - left.opportunityScore).slice(0, 5);
  const dividendCandidates = [...stocks].sort((left, right) => right.dividendScore - left.dividendScore).slice(0, 5);
  const sectorRanking = [...sectors].sort((left, right) => right.score - left.score);
  const avoidList = stocks.filter((stock) => stock.opportunityScore < 50 || stock.riskLevel === "High");

  const sections = [
    {
      title: "Executive Summary",
      lines: [
        aiBriefing,
        `Portfolio value is ${formatCompactNaira(portfolio.value)} with ${portfolio.gainPercent.toFixed(1)}% unrealized gain/loss and ${formatCompactNaira(portfolio.dividends)} dividends received.`,
        "This report is for personal research only. It does not place trades or issue direct buy/sell instructions.",
      ],
    },
    {
      title: "Top Opportunities",
      lines: topOpportunities.map(
        (stock, index) =>
          `${index + 1}. ${stock.symbol} (${stock.sector}) - Opportunity ${stock.opportunityScore}/100, dividend ${stock.dividendScore}/100, yield ${stock.dividendYield.toFixed(2)}%. ${stock.reason}`,
      ),
    },
    {
      title: "Sector Ranking",
      lines: sectorRanking.map((sector, index) => `${index + 1}. ${sector.name}: score ${sector.score}, change ${sector.change > 0 ? "+" : ""}${sector.change.toFixed(2)}%, best stock ${sector.bestStock}.`),
    },
    {
      title: "Dividend Candidates",
      lines: dividendCandidates.map((stock) => `${stock.symbol}: yield ${stock.dividendYield.toFixed(2)}%, dividend score ${stock.dividendScore}/100, payout ratio ${stock.payoutRatio}%.`),
    },
    {
      title: "Risk Warnings",
      lines: alerts.map((alert) => `${alert.title}: ${alert.detail} (${alert.count} active).`),
    },
    {
      title: "Watchlist Movement",
      lines: watchlist.map((item) => `${item.symbol}: target ${formatNaira(item.targetPrice)}, movement ${item.movement > 0 ? "+" : ""}${item.movement.toFixed(2)}%. ${item.note}`),
    },
    {
      title: "Portfolio Notes",
      lines: holdings.map((holding) => `${holding.symbol}: ${holding.quantity.toLocaleString()} shares via ${holding.broker}; thesis: ${holding.thesis}`),
    },
    {
      title: "Next Research Tasks",
      lines: [
        "Review Banking exposure before adding more GTCO, Zenith Bank, or UBA.",
        "Check dividend cover and payout sustainability before treating yield as income quality.",
        "Confirm latest Stanbic IBTC contract notes and portfolio statements are reconciled locally.",
        ...changedItems.slice(0, 3).map((item) => `Investigate ${item.symbol}: ${item.detail}.`),
      ],
    },
  ];

  if (type === "portfolio-risk") {
    sections.unshift({
      title: "Portfolio Risk Focus",
      lines: [
        "Banking is the largest allocation and should be reviewed against the 50% concentration threshold.",
        "No broker execution is automated; all trade actions remain manual through Stanbic IBTC.",
      ],
    });
  }

  if (type === "avoid-list") {
    sections.unshift({
      title: "Avoid / Review Names",
      lines: avoidList.map((stock) => `${stock.symbol}: ${stock.label}; opportunity ${stock.opportunityScore}/100, risk ${stock.riskLevel}.`),
    });
  }

  return {
    id: definition.id,
    title: definition.title,
    generatedAt,
    summary: sections[0].lines[0],
    sections,
    markdown: toMarkdown(definition.title, generatedAt, sections),
    csv: toCsv(definition.title, generatedAt, sections),
  };
}

export function getReportContent(type: ReportType, format: ReportFormat) {
  const report = generateReport(type);
  if (format === "csv") return { content: report.csv, contentType: "text/csv; charset=utf-8", filename: `${type}.csv` };
  if (format === "json") return { content: JSON.stringify(report, null, 2), contentType: "application/json; charset=utf-8", filename: `${type}.json` };
  return { content: report.markdown, contentType: "text/markdown; charset=utf-8", filename: `${type}.md` };
}

function toMarkdown(title: string, generatedAt: string, sections: GeneratedReport["sections"]) {
  return [
    `# ${title}`,
    "",
    `Generated: ${generatedAt}`,
    "",
    ...sections.flatMap((section) => [`## ${section.title}`, "", ...section.lines.map((line) => `- ${line}`), ""]),
  ].join("\n");
}

function toCsv(title: string, generatedAt: string, sections: GeneratedReport["sections"]) {
  const rows = [["report", "generatedAt", "section", "line"]];
  for (const section of sections) {
    for (const line of section.lines) rows.push([title, generatedAt, section.title, line]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
