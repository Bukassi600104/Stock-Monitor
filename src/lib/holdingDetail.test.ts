import assert from "node:assert/strict";
import { getHoldingDetail } from "./holdingDetail";

const detail = getHoldingDetail("h-gtco");

assert.ok(detail);
assert.equal(detail.holding.symbol, "GTCO");
assert.equal(detail.stock?.symbol, "GTCO");
assert.equal(detail.position.currentValue, 1305000);
assert.equal(detail.position.totalCost, 1051200);
assert.equal(detail.position.unrealizedGain, 253800);
assert.equal(detail.position.unrealizedGainPercent, 24.14);
assert.equal(detail.position.portfolioWeightPercent, 31.27);
assert.ok(detail.transactions.some((transaction) => transaction.reference === "SIBTC-CN-001"));
assert.ok(detail.documents.some((document) => document.title.includes("GTCO")));
assert.equal(detail.aiReview.label, "Monitor");
assert.match(detail.aiReview.summary, /GTCO/i);
assert.match(detail.aiReview.summary, /does not place trades/i);

const missing = getHoldingDetail("missing");

assert.equal(missing, null);

console.log("holding detail tests passed");
