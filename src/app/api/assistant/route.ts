import { NextResponse } from "next/server";
import { answerAssistant } from "@/lib/assistant";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { question?: unknown };
  const question = typeof body.question === "string" ? body.question : "";

  return NextResponse.json(answerAssistant(question));
}
