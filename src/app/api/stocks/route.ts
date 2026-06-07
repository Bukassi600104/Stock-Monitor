import { NextResponse } from "next/server";
import { stocks } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ stocks });
}
