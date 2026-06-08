export type ImportKind = "stocks" | "prices" | "dividends" | "portfolio";

export type ImportIssue = {
  row: number;
  field: string;
  severity: "error" | "warning";
  message: string;
};

export type ImportValidationResult = {
  kind: ImportKind;
  rowCount: number;
  validRows: number;
  rejectedRows: number;
  issues: ImportIssue[];
  rows: Record<string, string>[];
};

export const importTemplates: Record<ImportKind, { label: string; sourceType: string; csv: string }> = {
  stocks: {
    label: "Stocks CSV",
    sourceType: "Manual CSV",
    csv: "symbol,companyName,sector,subsector,status\nMTNN,MTN Nigeria Communications Plc,ICT,Telecommunications,ACTIVE\nZENITHBANK,Zenith Bank Plc,Financial Services,Banking,ACTIVE\nGTCO,Guaranty Trust Holding Company Plc,Financial Services,Banking,ACTIVE",
  },
  prices: {
    label: "Price CSV",
    sourceType: "Manual CSV",
    csv: "symbol,date,close,previousClose,change,changePercent,volume,valueTraded,marketCap,source\nMTNN,2026-06-07,245,240,5,2.08,9850000,2413250000,4990000000000,manual\nGTCO,2026-06-07,72.5,71.7,0.8,1.12,48200000,3494500000,2130000000000,manual",
  },
  dividends: {
    label: "Dividend CSV",
    sourceType: "Manual CSV",
    csv: "symbol,year,amountPerShare,dividendType,declarationDate,qualificationDate,paymentDate,source\nZENITHBANK,2025,4.90,FINAL,2026-03-01,2026-04-15,2026-05-20,manual\nGTCO,2025,5.25,FINAL,2026-03-05,2026-04-18,2026-05-22,manual",
  },
  portfolio: {
    label: "Portfolio CSV",
    sourceType: "Stanbic IBTC Broker Export",
    csv: "brokerName,symbol,quantity,buyPrice,buyDate,charges,notes\nStanbic IBTC Stockbrokers,GTCO,100,58.4,2026-06-07,250,First test entry",
  },
};

const requiredFields: Record<ImportKind, string[]> = {
  stocks: ["symbol", "companyName", "sector", "status"],
  prices: ["symbol", "date", "close", "previousClose", "volume", "source"],
  dividends: ["symbol", "year", "amountPerShare", "dividendType", "source"],
  portfolio: ["brokerName", "symbol", "quantity", "buyPrice", "buyDate", "charges"],
};

export function parseCsv(csv: string) {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { headers: [] as string[], rows: [] as Record<string, string>[] };

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index]?.trim() ?? "";
      return row;
    }, {});
  });

  return { headers, rows };
}

export function validateImport(kind: ImportKind, csv: string): ImportValidationResult {
  const { headers, rows } = parseCsv(csv);
  const issues: ImportIssue[] = [];
  const required = requiredFields[kind];

  for (const field of required) {
    if (!headers.includes(field)) {
      issues.push({ row: 1, field, severity: "error", message: `Missing required column: ${field}` });
    }
  }

  const seenSymbols = new Set<string>();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const symbol = normalizeSymbol(row.symbol);

    if (!symbol) {
      issues.push({ row: rowNumber, field: "symbol", severity: "error", message: "Missing symbol" });
    } else if (seenSymbols.has(symbol) && kind !== "prices" && kind !== "dividends") {
      issues.push({ row: rowNumber, field: "symbol", severity: "warning", message: `Duplicate symbol ${symbol}` });
    }
    seenSymbols.add(symbol);

    if (kind === "stocks") validateStocksRow(row, rowNumber, issues);
    if (kind === "prices") validatePricesRow(row, rowNumber, issues);
    if (kind === "dividends") validateDividendsRow(row, rowNumber, issues);
    if (kind === "portfolio") validatePortfolioRow(row, rowNumber, issues);
  });

  const rejectedRows = new Set(issues.filter((issue) => issue.severity === "error").map((issue) => issue.row)).size;

  return {
    kind,
    rowCount: rows.length,
    validRows: Math.max(0, rows.length - rejectedRows),
    rejectedRows,
    issues,
    rows,
  };
}

function validateStocksRow(row: Record<string, string>, rowNumber: number, issues: ImportIssue[]) {
  if (!row.companyName) issues.push({ row: rowNumber, field: "companyName", severity: "error", message: "Missing company name" });
  if (!row.sector) issues.push({ row: rowNumber, field: "sector", severity: "error", message: "Missing sector" });
  if (row.status && !["ACTIVE", "SUSPENDED", "DELISTED"].includes(row.status.toUpperCase())) {
    issues.push({ row: rowNumber, field: "status", severity: "warning", message: "Unknown status value" });
  }
}

function validatePricesRow(row: Record<string, string>, rowNumber: number, issues: ImportIssue[]) {
  const close = numberValue(row.close);
  const previousClose = numberValue(row.previousClose);
  const volume = numberValue(row.volume);
  const date = dateValue(row.date);

  if (!date) issues.push({ row: rowNumber, field: "date", severity: "error", message: "Missing or invalid date" });
  if (close <= 0) issues.push({ row: rowNumber, field: "close", severity: "error", message: "Invalid price; close must be greater than zero" });
  if (previousClose < 0) issues.push({ row: rowNumber, field: "previousClose", severity: "warning", message: "Previous close should not be negative" });
  if (volume === 0) issues.push({ row: rowNumber, field: "volume", severity: "warning", message: "Zero volume may indicate stale or illiquid data" });
  if (date && daysOld(date) > 7) issues.push({ row: rowNumber, field: "date", severity: "warning", message: "Date is older than the current import window" });
}

function validateDividendsRow(row: Record<string, string>, rowNumber: number, issues: ImportIssue[]) {
  const year = numberValue(row.year);
  const amount = numberValue(row.amountPerShare);
  if (year < 1990) issues.push({ row: rowNumber, field: "year", severity: "error", message: "Invalid dividend year" });
  if (amount <= 0) issues.push({ row: rowNumber, field: "amountPerShare", severity: "warning", message: "Dividend amount is zero or missing" });
  if (amount > 100) issues.push({ row: rowNumber, field: "amountPerShare", severity: "warning", message: "Suspicious dividend amount; confirm units" });
}

function validatePortfolioRow(row: Record<string, string>, rowNumber: number, issues: ImportIssue[]) {
  const quantity = numberValue(row.quantity);
  const buyPrice = numberValue(row.buyPrice);
  const charges = numberValue(row.charges);
  const buyDate = dateValue(row.buyDate);

  if (!row.brokerName) issues.push({ row: rowNumber, field: "brokerName", severity: "error", message: "Missing broker name" });
  if (row.brokerName && !row.brokerName.toLowerCase().includes("stanbic")) {
    issues.push({ row: rowNumber, field: "brokerName", severity: "warning", message: "Broker differs from default Stanbic IBTC workflow" });
  }
  if (quantity <= 0) issues.push({ row: rowNumber, field: "quantity", severity: "error", message: "Quantity must be greater than zero" });
  if (buyPrice <= 0) issues.push({ row: rowNumber, field: "buyPrice", severity: "error", message: "Buy price must be greater than zero" });
  if (charges < 0) issues.push({ row: rowNumber, field: "charges", severity: "warning", message: "Charges should not be negative" });
  if (!buyDate) issues.push({ row: rowNumber, field: "buyDate", severity: "error", message: "Missing or invalid buy date" });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function normalizeSymbol(value = "") {
  return value.trim().toUpperCase();
}

function numberValue(value = "") {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value = "") {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysOld(date: Date) {
  const now = new Date("2026-06-08T00:00:00+01:00");
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}
