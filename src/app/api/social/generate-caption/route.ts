import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSingleCaption } from "@/lib/social/daily-caption-generator";
import { ContentPillar, CaptionType } from "@/lib/social/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pillar: ContentPillar = body.pillar || "Youth empowerment";
    const captionType: CaptionType = body.captionType || "Personal story";
    const contextText: string | undefined = body.contextText;
    const contextId: string | undefined = body.contextId;

    const candidate = await generateSingleCaption(pillar, captionType, contextText, contextId);

    if (!candidate) {
      return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 });
    }

    const saved = await prisma.captionBankItem.create({
      data: {
        title: candidate.title,
        caption: candidate.caption,
        hashtags: candidate.hashtags,
        contentType: candidate.contentType,
        contentPillar: candidate.contentPillar,
        topic: candidate.topic,
        targetAudience: candidate.targetAudience,
        contextId: contextId || null,
        priority: "HIGH",
        status: "ready_for_review",
        factCheckStatus: candidate.factCheckStatus,
        repetitionCheckScore: candidate.repetitionCheckScore,
        brandConsistencyScore: candidate.brandConsistencyScore
      }
    });

    return NextResponse.json({ caption: saved });
  } catch (err: any) {
    console.error("Generate caption error:", err);
    return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 });
  }
}
