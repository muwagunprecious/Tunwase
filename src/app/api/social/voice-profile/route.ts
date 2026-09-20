import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureWritingProfile } from "@/lib/social/editor-learning-loop";

export async function GET() {
  try {
    const profile = await ensureWritingProfile();
    return NextResponse.json({
      profile: {
        ...profile,
        learnedRules: JSON.parse(profile.learnedRulesJson || "[]")
      }
    });
  } catch (err: any) {
    console.error("Failed to fetch writing profile:", err);
    return NextResponse.json({ error: "Failed to fetch writing profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = await ensureWritingProfile();

    const updated = await prisma.adetunwaseWritingProfile.update({
      where: { id: profile.id },
      data: {
        emotionalTone: body.emotionalTone || profile.emotionalTone,
        paragraphRhythm: body.paragraphRhythm || profile.paragraphRhythm,
        sentenceRhythm: body.sentenceRhythm || profile.sentenceRhythm,
        favoredWords: body.favoredWords || profile.favoredWords,
        avoidedWords: body.avoidedWords || profile.avoidedWords,
        learnedRulesJson: body.learnedRules ? JSON.stringify(body.learnedRules) : profile.learnedRulesJson
      }
    });

    return NextResponse.json({
      profile: {
        ...updated,
        learnedRules: JSON.parse(updated.learnedRulesJson || "[]")
      }
    });
  } catch (err: any) {
    console.error("Failed to update writing profile:", err);
    return NextResponse.json({ error: "Failed to update writing profile" }, { status: 500 });
  }
}
