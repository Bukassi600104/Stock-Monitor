import assert from "node:assert/strict";
import { buildHoldingDraft, validateHoldingDraft } from "./holdingDraft";

const gtcoDraft = buildHoldingDraft({
  symbol: "gtco",
  buyDate: "2026-06-08",
  quantity: 1200,
  buyPrice: 70,
  charges: 1500,
  vatFees: 250,
  personalReason: "Dividend core",
  thesis: "Testing a tier-one bank entry.",
});

assert.equal(gtcoDraft.symbol, "GTCO");
assert.equal(gtcoDraft.company, "Guaranty Trust Holding Co.");
assert.equal(gtcoDraft.broker, "Stanbic IBTC Stockbrokers");
assert.equal(gtcoDraft.dataStatus, "linked");
assert.equal(gtcoDraft.grossPurchaseValue, 84000);
assert.equal(gtcoDraft.totalCost, 85750);
assert.equal(gtcoDraft.averageCostPerShare, 71.46);
assert.deepEqual(validateHoldingDraft(gtcoDraft), []);

const unknownDraft = buildHoldingDraft({
  symbol: "newstock",
  company: "New Stock Plc",
  quantity: 0,
  buyPrice: 0,
});

const issues = validateHoldingDraft(unknownDraft);

assert.equal(unknownDraft.symbol, "NEWSTOCK");
assert.equal(unknownDraft.dataStatus, "incomplete");
assert.ok(issues.some((issue) => issue.field === "quantity" && issue.severity === "error"));
assert.ok(issues.some((issue) => issue.field === "buyPrice" && issue.severity === "error"));
assert.ok(issues.some((issue) => issue.field === "symbol" && issue.severity === "warning"));

console.log("holding draft tests passed");
