import { NextResponse } from "next/server";
import { lastUpdated, stocks } from "@/lib/data";

export async function POST() {
  return NextResponse.json({
    status: "fresh",
    mode: "local-simulated-refresh",
    lastUpdated,
    scanned: stocks.length,
    message: "Local data refresh completed. Live NGX feed integration can replace this response later.",
  });
}
