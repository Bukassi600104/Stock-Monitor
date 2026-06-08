import { brokerSetup, stocks } from "./data";

export type HoldingDraftInput = {
  symbol: string;
  company?: string;
  broker?: string;
  brokerAccountNickname?: string;
  buyDate?: string;
  settlementDate?: string;
  quantity: number;
  buyPrice: number;
  charges?: number;
  vatFees?: number;
  cscsNumber?: string;
  chn?: string;
  contractNoteReference?: string;
  personalReason?: string;
  thesis?: string;
  targetHoldingPeriod?: string;
  dividendExpectation?: string;
  riskConcern?: string;
  tag?: HoldingDraftTag;
};

export type HoldingDraftTag = "Core Holding" | "Dividend Income" | "Value Play" | "Defensive" | "Speculative" | "Learning Position";
export type HoldingDraftDataStatus = "linked" | "incomplete";

export type HoldingDraft = Required<Pick<HoldingDraftInput, "symbol" | "company" | "broker" | "quantity" | "buyPrice" | "charges" | "vatFees">> &
  Omit<HoldingDraftInput, "symbol" | "company" | "broker" | "quantity" | "buyPrice" | "charges" | "vatFees"> & {
    sector: string;
    currentPrice: number | null;
    dataStatus: HoldingDraftDataStatus;
    grossPurchaseValue: number;
    totalCost: number;
    averageCostPerShare: number;
  };

export type HoldingDraftIssue = {
  field: string;
  severity: "error" | "warning";
  message: string;
};

export function buildHoldingDraft(input: HoldingDraftInput): HoldingDraft {
  const symbol = input.symbol.trim().toUpperCase();
  const stock = stocks.find((item) => item.symbol === symbol);
  const charges = input.charges ?? 0;
  const vatFees = input.vatFees ?? 0;
  const grossPurchaseValue = roundMoney(input.quantity * input.buyPrice);
  const totalCost = roundMoney(grossPurchaseValue + charges + vatFees);

  return {
    ...input,
    symbol,
    company: stock?.company ?? input.company?.trim() ?? "",
    sector: stock?.sector ?? "Unlinked",
    broker: input.broker?.trim() || brokerSetup.brokerName,
    brokerAccountNickname: input.brokerAccountNickname ?? brokerSetup.accountNickname,
    cscsNumber: input.cscsNumber ?? brokerSetup.cscsNumber,
    chn: input.chn ?? brokerSetup.chn,
    tag: input.tag ?? "Learning Position",
    quantity: input.quantity,
    buyPrice: input.buyPrice,
    charges,
    vatFees,
    currentPrice: stock?.price ?? null,
    dataStatus: stock ? "linked" : "incomplete",
    grossPurchaseValue,
    totalCost,
    averageCostPerShare: input.quantity > 0 ? roundMoney(totalCost / input.quantity) : 0,
  };
}

export function validateHoldingDraft(draft: HoldingDraft): HoldingDraftIssue[] {
  const issues: HoldingDraftIssue[] = [];

  if (!draft.symbol) {
    issues.push({ field: "symbol", severity: "error", message: "Stock symbol is required." });
  } else if (draft.dataStatus === "incomplete") {
    issues.push({ field: "symbol", severity: "warning", message: "Symbol is not in the market scanner yet; save as incomplete until data is imported." });
  }

  if (!draft.company) {
    issues.push({ field: "company", severity: "error", message: "Company name is required when the symbol is not linked." });
  }

  if (draft.quantity <= 0) {
    issues.push({ field: "quantity", severity: "error", message: "Quantity must be greater than zero." });
  }

  if (draft.buyPrice <= 0) {
    issues.push({ field: "buyPrice", severity: "error", message: "Buy price must be greater than zero." });
  }

  if (draft.charges < 0 || draft.vatFees < 0) {
    issues.push({ field: "charges", severity: "error", message: "Charges and fees cannot be negative." });
  }

  return issues;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
