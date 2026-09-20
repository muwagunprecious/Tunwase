import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestRawContext } from "@/lib/social/context-engine";

export async function GET() {
  try {
    const contexts = await prisma.contentContext.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { captionItems: true } }
      }
    });

    return NextResponse.json({ contexts });
  } catch (err: any) {
    console.error("Failed to list contexts:", err);
    return NextResponse.json({ error: "Failed to list contexts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawInput, attachments } = body;

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json({ error: "rawInput string is required" }, { status: 400 });
    }

    const context = await ingestRawContext(rawInput, attachments || []);
    return NextResponse.json({ context });
  } catch (err: any) {
    console.error("Failed to ingest context:", err);
    return NextResponse.json({ error: "Failed to ingest context" }, { status: 500 });
  }
}
