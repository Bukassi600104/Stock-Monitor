import assert from "node:assert/strict";
import { buildTransactionDraft, validateTransactionDraft } from "./transactionDraft";

const buyDraft = buildTransactionDraft({
  symbol: "GTCO",
  type: "Buy",
  transactionDate: "2026-06-08",
  settlementDate: "2026-06-11",
  quantity: 1500,
  price: 72.5,
  charges: 1800,
  reference: "SIBTC-CN-NEW",
});

assert.equal(buyDraft.symbol, "GTCO");
assert.equal(buyDraft.broker, "Stanbic IBTC Stockbrokers");
assert.equal(buyDraft.company, "Guaranty Trust Holding Co.");
assert.equal(buyDraft.effect.quantityChange, 1500);
assert.equal(buyDraft.effect.incomeChange, 0);
assert.equal(buyDraft.grossAmount, 108750);
assert.equal(buyDraft.netAmount, 110550);
assert.deepEqual(validateTransactionDraft(buyDraft), []);

const dividendDraft = buildTransactionDraft({
  symbol: "GTCO",
  type: "Dividend Received",
  transactionDate: "2026-07-20",
  quantity: 18000,
  price: 2.5,
  withholdingTax: 4500,
  reference: "DIV-GTCO-2026-I",
});

assert.equal(dividendDraft.effect.quantityChange, 0);
assert.equal(dividendDraft.effect.incomeChange, 40500);
assert.equal(dividendDraft.netAmount, 40500);

const invalidSell = buildTransactionDraft({
  symbol: "UNKNOWN",
  type: "Sell",
  transactionDate: "",
  quantity: 0,
  price: 0,
});

const issues = validateTransactionDraft(invalidSell);

assert.ok(issues.some((issue) => issue.field === "symbol" && issue.severity === "warning"));
assert.ok(issues.some((issue) => issue.field === "transactionDate" && issue.severity === "error"));
assert.ok(issues.some((issue) => issue.field === "quantity" && issue.severity === "error"));
assert.ok(issues.some((issue) => issue.field === "price" && issue.severity === "error"));

console.log("transaction draft tests passed");
