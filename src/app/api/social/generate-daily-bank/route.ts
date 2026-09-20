import { NextRequest, NextResponse } from "next/server";
import { generateDailyLinkedInBank } from "@/lib/social/daily-caption-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize ? parseInt(body.batchSize, 10) : undefined;

    const result = await generateDailyLinkedInBank({ batchSize });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Daily bank generation error:", err);
    return NextResponse.json({ error: "Failed to generate daily bank", details: err.message }, { status: 500 });
  }
}
