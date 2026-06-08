import { brokerSetup, stocks } from "./data";

export type TransactionDraftType =
  | "Buy"
  | "Sell"
  | "Dividend Received"
  | "Bonus Shares"
  | "Rights Issue"
  | "Stock Split"
  | "Fee/Charge"
  | "Manual Adjustment"
  | "Transfer Between Brokers";

export type TransactionDraftInput = {
  symbol: string;
  type: TransactionDraftType;
  transactionDate: string;
  settlementDate?: string;
  broker?: string;
  quantity: number;
  price: number;
  charges?: number;
  withholdingTax?: number;
  reference?: string;
  notes?: string;
  uploadedDocumentPath?: string;
};

export type TransactionDraft = Required<Pick<TransactionDraftInput, "symbol" | "type" | "transactionDate" | "broker" | "quantity" | "price" | "charges" | "withholdingTax">> &
  Omit<TransactionDraftInput, "symbol" | "type" | "transactionDate" | "broker" | "quantity" | "price" | "charges" | "withholdingTax"> & {
    company: string;
    dataStatus: "linked" | "incomplete";
    grossAmount: number;
    netAmount: number;
    effect: {
      quantityChange: number;
      costBasisChange: number;
      incomeChange: number;
    };
  };

export type TransactionDraftIssue = {
  field: string;
  severity: "error" | "warning";
  message: string;
};

export function buildTransactionDraft(input: TransactionDraftInput): TransactionDraft {
  const symbol = input.symbol.trim().toUpperCase();
  const stock = stocks.find((item) => item.symbol === symbol);
  const charges = input.charges ?? 0;
  const withholdingTax = input.withholdingTax ?? 0;
  const grossAmount = roundMoney(input.quantity * input.price);
  const effect = calculateEffect(input.type, grossAmount, charges, withholdingTax, input.quantity);

  return {
    ...input,
    symbol,
    broker: input.broker?.trim() || brokerSetup.brokerName,
    company: stock?.company ?? "",
    dataStatus: stock ? "linked" : "incomplete",
    charges,
    withholdingTax,
    grossAmount,
    netAmount: effect.typeNetAmount,
    effect: {
      quantityChange: effect.quantityChange,
      costBasisChange: effect.costBasisChange,
      incomeChange: effect.incomeChange,
    },
  };
}

export function validateTransactionDraft(draft: TransactionDraft): TransactionDraftIssue[] {
  const issues: TransactionDraftIssue[] = [];

  if (!draft.symbol) {
    issues.push({ field: "symbol", severity: "error", message: "Stock symbol is required." });
  } else if (draft.dataStatus === "incomplete" && draft.type !== "Fee/Charge" && draft.type !== "Manual Adjustment") {
    issues.push({ field: "symbol", severity: "warning", message: "Symbol is not linked to the market scanner yet; keep this transaction marked incomplete until data is imported." });
  }

  if (!draft.transactionDate) {
    issues.push({ field: "transactionDate", severity: "error", message: "Transaction date is required." });
  }

  if (draft.quantity <= 0 && draft.type !== "Fee/Charge" && draft.type !== "Manual Adjustment") {
    issues.push({ field: "quantity", severity: "error", message: "Quantity must be greater than zero for stock and dividend movements." });
  }

  if (draft.price <= 0 && draft.type !== "Bonus Shares" && draft.type !== "Stock Split" && draft.type !== "Manual Adjustment") {
    issues.push({ field: "price", severity: "error", message: "Price or amount per share must be greater than zero." });
  }

  if (draft.charges < 0 || draft.withholdingTax < 0) {
    issues.push({ field: "charges", severity: "error", message: "Charges and withholding tax cannot be negative." });
  }

  return issues;
}

function calculateEffect(type: TransactionDraftType, grossAmount: number, charges: number, withholdingTax: number, quantity: number) {
  if (type === "Buy" || type === "Rights Issue") {
    const netAmount = roundMoney(grossAmount + charges);
    return { quantityChange: quantity, costBasisChange: netAmount, incomeChange: 0, typeNetAmount: netAmount };
  }

  if (type === "Sell") {
    const netAmount = roundMoney(grossAmount - charges);
    return { quantityChange: -quantity, costBasisChange: 0, incomeChange: 0, typeNetAmount: netAmount };
  }

  if (type === "Dividend Received") {
    const netAmount = roundMoney(grossAmount - withholdingTax);
    return { quantityChange: 0, costBasisChange: 0, incomeChange: netAmount, typeNetAmount: netAmount };
  }

  if (type === "Bonus Shares") {
    return { quantityChange: quantity, costBasisChange: 0, incomeChange: 0, typeNetAmount: 0 };
  }

  if (type === "Stock Split" || type === "Transfer Between Brokers") {
    return { quantityChange: 0, costBasisChange: 0, incomeChange: 0, typeNetAmount: grossAmount };
  }

  if (type === "Fee/Charge") {
    return { quantityChange: 0, costBasisChange: charges || grossAmount, incomeChange: 0, typeNetAmount: charges || grossAmount };
  }

  return { quantityChange: 0, costBasisChange: 0, incomeChange: 0, typeNetAmount: grossAmount };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
