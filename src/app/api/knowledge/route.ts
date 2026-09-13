import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");
    const privacy = searchParams.get("privacy");

    const where: any = {};
    if (entity && entity !== "ALL") where.entity = entity;
    if (privacy && privacy !== "ALL") where.privacy = privacy;

    const facts = await prisma.knowledgeFact.findMany({
      where,
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ facts });
  } catch (error: any) {
    console.error("Fetch knowledge facts error:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge facts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fact, entity, category, source, sourceUrl, confidence, privacy } = await req.json();

    if (!fact || !entity) {
      return NextResponse.json({ error: "Fact and entity are required" }, { status: 400 });
    }

    const created = await prisma.knowledgeFact.create({
      data: {
        fact,
        entity,
        category: category || "General",
        source: source || "Direct Input",
        sourceUrl: sourceUrl || null,
        confidence: confidence || "High",
        privacy: privacy || "Public"
      }
    });

    return NextResponse.json({ fact: created });
  } catch (error: any) {
    console.error("Create fact error:", error);
    return NextResponse.json({ error: "Failed to create knowledge fact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Fact ID is required" }, { status: 400 });
    }

    await prisma.knowledgeFact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete fact error:", error);
    return NextResponse.json({ error: "Failed to delete fact" }, { status: 500 });
  }
}
