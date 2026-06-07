import { NextResponse } from "next/server";
import { portfolio } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    reports: ["Daily Market Briefing", "Dividend Income Report", "Holdings Review Report", "Portfolio Risk Report"],
    portfolio,
    exportFormats: ["CSV", "Markdown"],
  });
}
