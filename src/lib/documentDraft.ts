import { brokerSetup, documents, holdings, stocks, transactions } from "./data";

export type DocumentDraftType =
  | "Stanbic IBTC contract note"
  | "Stanbic IBTC portfolio statement"
  | "General contract note"
  | "Broker statement"
  | "CSCS statement"
  | "Dividend payment proof"
  | "Company annual report"
  | "Research report"
  | "Tax/withholding document";

export type DocumentDraftInput = {
  title: string;
  type: DocumentDraftType;
  documentDate: string;
  broker?: string;
  relatedStock?: string;
  relatedTransactionReference?: string;
  originalFileName: string;
  notes?: string;
};

export type DocumentDraft = Required<Pick<DocumentDraftInput, "title" | "type" | "documentDate" | "broker" | "originalFileName">> &
  Omit<DocumentDraftInput, "title" | "type" | "documentDate" | "broker" | "originalFileName"> & {
    storagePath: string;
    reconciliationStatus: "matched" | "needs transaction link" | "portfolio evidence" | "manual evidence";
  };

export type DocumentDraftIssue = {
  field: keyof DocumentDraftInput;
  severity: "error" | "warning";
  message: string;
};

export type DocumentReconciliationSummary = {
  defaultBroker: string;
  totalHoldings: number;
  holdingsWithContractNotes: number;
  holdingsNeedingContractNotes: string[];
  lastContractNoteDate: string;
  lastPortfolioStatementDate: string;
  localStorageRoot: string;
};

const DOCUMENT_ROOT = "data/documents/";
const DEFAULT_FILE_NAME = "pending-upload.pdf";

export function buildDocumentDraft(input: DocumentDraftInput): DocumentDraft {
  const type = input.type;
  const broker = input.broker?.trim() || brokerSetup.brokerName;
  const relatedStock = input.relatedStock?.trim().toUpperCase();
  const originalFileName = input.originalFileName.trim();
  const storagePath = buildStoragePath(type, originalFileName || DEFAULT_FILE_NAME);
  const linkedTransaction = input.relatedTransactionReference
    ? transactions.find((transaction) => transaction.reference.toUpperCase() === input.relatedTransactionReference?.trim().toUpperCase())
    : undefined;

  return {
    ...input,
    title: input.title.trim(),
    type,
    documentDate: input.documentDate,
    broker,
    relatedStock,
    relatedTransactionReference: input.relatedTransactionReference?.trim(),
    originalFileName,
    storagePath,
    reconciliationStatus: resolveReconciliationStatus(type, Boolean(linkedTransaction)),
  };
}

export function validateDocumentDraft(draft: DocumentDraft): DocumentDraftIssue[] {
  const issues: DocumentDraftIssue[] = [];

  if (!draft.title) {
    issues.push({ field: "title", severity: "error", message: "Document title is required." });
  }

  if (!draft.documentDate) {
    issues.push({ field: "documentDate", severity: "error", message: "Document date is required." });
  }

  if (!draft.originalFileName) {
    issues.push({ field: "originalFileName", severity: "error", message: "Choose or reference a local file before saving document metadata." });
  }

  if (draft.relatedStock && !stocks.some((stock) => stock.symbol === draft.relatedStock)) {
    issues.push({ field: "relatedStock", severity: "warning", message: "Related stock is not linked to the market scanner yet." });
  }

  if (draft.relatedTransactionReference && !transactions.some((transaction) => transaction.reference.toUpperCase() === draft.relatedTransactionReference?.toUpperCase())) {
    issues.push({ field: "relatedTransactionReference", severity: "warning", message: "Transaction reference was not found in the current ledger." });
  }

  if (draft.type.includes("contract note") && !draft.relatedTransactionReference) {
    issues.push({ field: "relatedTransactionReference", severity: "warning", message: "Contract notes should be linked to the Stanbic transaction reference when available." });
  }

  return issues;
}

export function summarizeDocumentReconciliation(): DocumentReconciliationSummary {
  const contractNotes = documents.filter((document) => document.type.toLowerCase().includes("contract note"));
  const portfolioStatements = documents.filter((document) => document.type.toLowerCase().includes("portfolio statement"));
  const contractNoteStocks = new Set(contractNotes.flatMap((document) => (document.relatedStock ? [document.relatedStock] : [])));

  return {
    defaultBroker: brokerSetup.brokerName,
    totalHoldings: holdings.length,
    holdingsWithContractNotes: contractNoteStocks.size,
    holdingsNeedingContractNotes: holdings.filter((holding) => !contractNoteStocks.has(holding.symbol)).map((holding) => holding.symbol),
    lastContractNoteDate: latestDate(contractNotes),
    lastPortfolioStatementDate: latestDate(portfolioStatements),
    localStorageRoot: DOCUMENT_ROOT,
  };
}

function buildStoragePath(type: DocumentDraftType, fileName: string) {
  return `${DOCUMENT_ROOT}${slugify(type)}/${slugifyFileName(fileName)}`;
}

function resolveReconciliationStatus(type: DocumentDraftType, hasLinkedTransaction: boolean): DocumentDraft["reconciliationStatus"] {
  if (type.includes("portfolio statement") || type.includes("CSCS statement")) return "portfolio evidence";
  if (type.includes("contract note")) return hasLinkedTransaction ? "matched" : "needs transaction link";
  return "manual evidence";
}

function latestDate(records: { date: string }[]) {
  return records.map((record) => record.date).sort().at(-1) ?? "Not uploaded";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugifyFileName(fileName: string) {
  const trimmed = fileName.trim();
  const dot = trimmed.lastIndexOf(".");
  const baseName = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const extension = dot > 0 ? trimmed.slice(dot + 1).toLowerCase() : "pdf";
  return `${slugify(baseName)}.${extension || "pdf"}`;
}
