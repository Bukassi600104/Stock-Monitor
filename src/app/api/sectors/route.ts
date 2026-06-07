import { NextResponse } from "next/server";
import { sectors } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ sectors });
}
