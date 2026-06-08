import { NextResponse } from "next/server";
import { z } from "zod";
import { importTemplates, validateImport } from "@/lib/imports";

const importRequestSchema = z.object({
  kind: z.enum(["stocks", "prices", "dividends", "portfolio"]),
  sourceName: z.string().min(1).default("Manual import"),
  sourceType: z.string().min(1).default("Manual CSV"),
  csv: z.string().min(1),
});

export async function GET() {
  return NextResponse.json({
    templates: importTemplates,
    sourceTypes: ["Manual CSV", "Stanbic IBTC Broker Export", "Broker Export", "NGX API", "Vendor API", "Custom URL"],
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = importRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "failed",
        message: "Import request is invalid.",
        issues: parsed.error.issues.map((issue) => ({
          row: 0,
          field: issue.path.join("."),
          severity: "error",
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const result = validateImport(parsed.data.kind, parsed.data.csv);
  const hasErrors = result.issues.some((issue) => issue.severity === "error");

  return NextResponse.json({
    status: hasErrors ? "needs_review" : "validated",
    sourceName: parsed.data.sourceName,
    sourceType: parsed.data.sourceType,
    storageMode: "local-validation-only",
    message: hasErrors
      ? "Import found blocking data-quality issues. Fix the CSV before saving to local storage."
      : "Import passed data-quality checks and is ready for local SQLite persistence.",
    result,
  });
}
