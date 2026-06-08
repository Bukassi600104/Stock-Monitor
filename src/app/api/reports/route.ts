import { NextResponse } from "next/server";
import { generateReport, getReportContent, reportDefinitions, type ReportFormat, type ReportType } from "@/lib/reports";

const reportIds = new Set(reportDefinitions.map((report) => report.id));
const formats = new Set(["markdown", "csv", "json"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = normalizeReportType(url.searchParams.get("type"));
  const format = normalizeFormat(url.searchParams.get("format"));

  if (url.searchParams.get("download") === "true") {
    const exportFile = getReportContent(type, format);
    return new Response(exportFile.content, {
      headers: {
        "Content-Type": exportFile.contentType,
        "Content-Disposition": `attachment; filename="${exportFile.filename}"`,
      },
    });
  }

  const report = generateReport(type);
  return NextResponse.json({
    reports: reportDefinitions,
    selected: report,
    exportFormats: ["markdown", "csv", "json"],
    pdfStatus: "planned",
  });
}

function normalizeReportType(value: string | null): ReportType {
  return reportIds.has(value as ReportType) ? (value as ReportType) : "daily-market-briefing";
}

function normalizeFormat(value: string | null): ReportFormat {
  return formats.has(value ?? "") ? (value as ReportFormat) : "markdown";
}
