import { NextResponse } from "next/server";
import { stocks } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    scores: stocks.map((stock) => ({
      symbol: stock.symbol,
      opportunityScore: stock.opportunityScore,
      dividendScore: stock.dividendScore,
      valuationScore: stock.valuationScore,
      liquidityScore: stock.liquidityScore,
      riskScore: stock.riskScore,
      label: stock.label,
    })),
  });
}
