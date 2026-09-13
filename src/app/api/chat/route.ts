import { NextRequest, NextResponse } from "next/server";
import { processUserMessage } from "@/lib/agents/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const { message, history, contextMode, campaignLeads } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const result = await processUserMessage(message, history || [], contextMode, campaignLeads || []);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process assistant request.",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
