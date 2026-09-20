import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSingleCaption } from "@/lib/social/daily-caption-generator";
import { ContentPillar, CaptionType } from "@/lib/social/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.captionBankItem.findUnique({
      where: { id: params.id },
      include: { context: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Caption item not found" }, { status: 404 });
    }

    const newCandidate = await generateSingleCaption(
      existing.contentPillar as ContentPillar,
      existing.contentType as CaptionType,
      existing.context ? `${existing.context.topic}: ${existing.context.description}` : undefined,
      existing.contextId || undefined
    );

    if (!newCandidate) {
      return NextResponse.json({ error: "Regeneration failed" }, { status: 500 });
    }

    const updated = await prisma.captionBankItem.update({
      where: { id: params.id },
      data: {
        title: newCandidate.title,
        caption: newCandidate.caption,
        hashtags: newCandidate.hashtags,
        status: "ready_for_review",
        rejectionReason: null,
        factCheckStatus: newCandidate.factCheckStatus,
        repetitionCheckScore: newCandidate.repetitionCheckScore
      }
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("Regenerate caption error:", err);
    return NextResponse.json({ error: "Failed to regenerate caption" }, { status: 500 });
  }
}
