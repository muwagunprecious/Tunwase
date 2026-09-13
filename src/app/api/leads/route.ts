import { NextRequest, NextResponse } from "next/server";
import { scrapeTargetLeads } from "@/lib/agents/openleads-scraper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword = "companies", location = "Global", projectName, limit = 10 } = body;

    const result = await scrapeTargetLeads({
      keyword,
      location,
      projectName,
      limit: Math.min(Number(limit) || 10, 30)
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenLeads API error:", error);
    return NextResponse.json(
      { error: "Failed to scrape leads.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || searchParams.get("q") || "marketers";
    const location = searchParams.get("location") || searchParams.get("city") || "Global";
    const limit = Number(searchParams.get("limit") || 10);
    const format = searchParams.get("format");

    const result = await scrapeTargetLeads({
      keyword,
      location,
      limit: Math.min(limit, 30)
    });

    if (format === "csv") {
      const headers = ["Company", "Category", "Contact Person", "Role", "Email", "Email Type", "Phone", "Website", "Location"];
      const rows = result.leads.map((l) => [
        `"${l.companyName.replace(/"/g, '""')}"`,
        `"${l.category.replace(/"/g, '""')}"`,
        `"${l.contactPerson.replace(/"/g, '""')}"`,
        `"${l.role.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${l.emailType.replace(/"/g, '""')}"`,
        `"${l.phone.replace(/"/g, '""')}"`,
        `"${l.website.replace(/"/g, '""')}"`,
        `"${l.location.replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="openleads_${location.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv"`
        }
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenLeads GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
