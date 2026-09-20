import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureInitialReferenceWriter } from "@/lib/social/reference-writer-engine";

export async function GET() {
  try {
    await ensureInitialReferenceWriter();

    const writers = await prisma.referenceWriter.findMany({
      include: {
        _count: { select: { posts: true } },
        styleProfile: true
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ writers });
  } catch (err: any) {
    console.error("Failed to list reference writers:", err);
    return NextResponse.json({ error: "Failed to list reference writers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, linkedinUrl, bio, notes } = body;

    if (!name || !linkedinUrl) {
      return NextResponse.json({ error: "Name and LinkedIn URL are required" }, { status: 400 });
    }

    const writer = await prisma.referenceWriter.upsert({
      where: { linkedinUrl },
      update: { name, bio, notes },
      create: { name, linkedinUrl, bio, notes }
    });

    return NextResponse.json({ writer });
  } catch (err: any) {
    console.error("Failed to save reference writer:", err);
    return NextResponse.json({ error: "Failed to save reference writer" }, { status: 500 });
  }
}
