import { NextResponse } from "next/server";
import { aiBriefing } from "@/lib/data";

export async function POST() {
  return NextResponse.json({
    answer: aiBriefing,
    guardrails: [
      "Uses available local market and portfolio data only.",
      "Does not place trades or issue direct buy/sell instructions.",
      "Discloses stale or missing data when live integrations are absent.",
    ],
  });
}
