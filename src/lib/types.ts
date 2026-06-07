export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High";

export type StockLabel =
  | "Strong Dividend Candidate"
  | "Good Watchlist Candidate"
  | "Undervalued but Risky"
  | "Stable Defensive Candidate"
  | "Overpriced Quality Stock"
  | "Low Liquidity Warning"
  | "Avoid for Now";

export type Stock = {
  symbol: string;
  company: string;
  sector: string;
  price: number;
  change: number;
  volume: number;
  marketCap: number;
  dividendYield: number;
  pe: number;
  roe: number;
  payoutRatio: number;
  opportunityScore: number;
  dividendScore: number;
  valuationScore: number;
  liquidityScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  label: StockLabel;
  reason: string;
  risks: string[];
  trend: number[];
};

export type Sector = {
  name: string;
  change: number;
  stocks: number;
  bestStock: string;
  score: number;
  tone: "positive" | "warning" | "danger" | "neutral";
};

export type Alert = {
  title: string;
  count: number;
  severity: "danger" | "warning" | "info";
  detail: string;
};

export type WatchlistItem = {
  symbol: string;
  targetPrice: number;
  note: string;
  movement: number;
};

export type Holding = {
  id: string;
  symbol: string;
  company: string;
  sector: string;
  broker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  dividendsReceived: number;
  expectedAnnualDividend: number;
  thesis: string;
  tag: "Core Holding" | "Dividend Income" | "Value Play" | "Defensive" | "Learning Position";
  riskLevel: RiskLevel;
};

export type Transaction = {
  id: string;
  date: string;
  symbol: string;
  broker: string;
  type: "Buy" | "Sell" | "Dividend Received" | "Bonus Shares" | "Fee/Charge";
  quantity: number;
  price: number;
  charges: number;
  netAmount: number;
  reference: string;
};

export type DocumentRecord = {
  title: string;
  type: string;
  broker: string;
  relatedStock?: string;
  date: string;
  path: string;
};

export type BrokerSetup = {
  brokerName: string;
  accountNickname: string;
  cscsNumber: string;
  chn: string;
  checklist: { label: string; done: boolean }[];
  links: { label: string; href: string }[];
};
