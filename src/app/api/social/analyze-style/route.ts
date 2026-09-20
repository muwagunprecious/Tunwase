import { NextRequest, NextResponse } from "next/server";
import { analyzeReferenceStyle, ensureInitialReferenceWriter } from "@/lib/social/reference-writer-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let writerId = body.writerId;

    if (!writerId) {
      const initialWriter = await ensureInitialReferenceWriter();
      writerId = initialWriter.id;
    }

    const styleProfile = await analyzeReferenceStyle(writerId);
    return NextResponse.json({ success: true, styleProfile });
  } catch (err: any) {
    console.error("Failed to analyze reference style:", err);
    return NextResponse.json({ error: "Failed to analyze style" }, { status: 500 });
  }
}
