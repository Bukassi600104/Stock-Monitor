import assert from "node:assert/strict";
import { buildDocumentDraft, summarizeDocumentReconciliation, validateDocumentDraft } from "./documentDraft";

const contractNoteDraft = buildDocumentDraft({
  title: "GTCO June contract note",
  type: "Stanbic IBTC contract note",
  documentDate: "2026-06-08",
  relatedStock: "gtco",
  relatedTransactionReference: "SIBTC-CN-001",
  originalFileName: "GTCO Contract Note.pdf",
});

assert.equal(contractNoteDraft.broker, "Stanbic IBTC Stockbrokers");
assert.equal(contractNoteDraft.relatedStock, "GTCO");
assert.equal(contractNoteDraft.storagePath, "data/documents/stanbic-ibtc-contract-note/gtco-contract-note.pdf");
assert.equal(contractNoteDraft.reconciliationStatus, "matched");
assert.deepEqual(validateDocumentDraft(contractNoteDraft), []);

const manualStatement = buildDocumentDraft({
  title: "May statement",
  type: "Stanbic IBTC portfolio statement",
  documentDate: "2026-05-31",
  originalFileName: "May Statement.PDF",
});

assert.equal(manualStatement.reconciliationStatus, "portfolio evidence");
assert.equal(manualStatement.storagePath, "data/documents/stanbic-ibtc-portfolio-statement/may-statement.pdf");

const missingMetadata = buildDocumentDraft({
  title: "",
  type: "Dividend payment proof",
  documentDate: "",
  relatedStock: "unknown",
  originalFileName: "",
});

const issues = validateDocumentDraft(missingMetadata);

assert.ok(issues.some((issue) => issue.field === "title" && issue.severity === "error"));
assert.ok(issues.some((issue) => issue.field === "documentDate" && issue.severity === "error"));
assert.ok(issues.some((issue) => issue.field === "originalFileName" && issue.severity === "error"));
assert.ok(issues.some((issue) => issue.field === "relatedStock" && issue.severity === "warning"));

const reconciliation = summarizeDocumentReconciliation();

assert.equal(reconciliation.defaultBroker, "Stanbic IBTC Stockbrokers");
assert.equal(reconciliation.totalHoldings, 4);
assert.equal(reconciliation.holdingsWithContractNotes, 1);
assert.ok(reconciliation.holdingsNeedingContractNotes.includes("ZENITHBANK"));
assert.ok(reconciliation.lastContractNoteDate >= "2026-01-12");
assert.equal(reconciliation.localStorageRoot, "data/documents/");

console.log("document draft tests passed");
