import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "validated",
    acceptedTemplates: ["prices.csv", "dividends.csv", "stocks.csv", "portfolio_transactions.csv", "documents.csv"],
    message: "CSV import endpoint is ready for local parser wiring.",
  });
}
