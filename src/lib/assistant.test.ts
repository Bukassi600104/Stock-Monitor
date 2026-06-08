import assert from "node:assert/strict";
import { answerAssistant } from "./assistant";

const comparison = answerAssistant("Compare GTCO with Zenith and UBA for a dividend portfolio");

assert.equal(comparison.intent, "stock-comparison");
assert.deepEqual(comparison.comparedSymbols, ["GTCO", "ZENITHBANK", "UBA"]);
assert.match(comparison.answer, /GTCO/i);
assert.match(comparison.answer, /ZENITHBANK/i);
assert.match(comparison.answer, /UBA/i);
assert.ok(comparison.facts.some((fact) => fact.includes("opportunity")));
assert.ok(comparison.interpretation.some((item) => item.includes("GTCO")));
assert.ok(comparison.risks.some((risk) => risk.toLowerCase().includes("banking")));
assert.match(comparison.dataStatus, /June 7, 2026 21:45 WAT/);
assert.ok(comparison.guardrails.some((guardrail) => guardrail.toLowerCase().includes("does not issue direct buy")));

const concentration = answerAssistant("Am I overexposed to banking?");

assert.equal(concentration.intent, "portfolio-risk");
assert.match(concentration.answer, /Banking/i);
assert.ok(concentration.facts.some((fact) => fact.includes("%")));
assert.ok(concentration.suggestedLabel.match(/Review|Monitor|Still fits strategy/));

const unknown = answerAssistant("Should I buy ACCESSCORP today?");

assert.equal(unknown.intent, "unknown");
assert.match(unknown.answer, /not available/i);
assert.ok(unknown.risks.some((risk) => risk.toLowerCase().includes("missing")));
assert.ok(unknown.guardrails.some((guardrail) => guardrail.toLowerCase().includes("manual")));

console.log("assistant tests passed");
