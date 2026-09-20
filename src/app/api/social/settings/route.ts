import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEngineSettings } from "@/lib/social/daily-caption-generator";

export async function GET() {
  try {
    const settings = await getEngineSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error("Failed to fetch social settings:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await getEngineSettings();

    const updated = await prisma.socialEngineSettings.update({
      where: { id: settings.id },
      data: {
        dailyCaptionsCount: body.dailyCaptionsCount !== undefined ? parseInt(body.dailyCaptionsCount, 10) : settings.dailyCaptionsCount,
        minBacklogCount: body.minBacklogCount !== undefined ? parseInt(body.minBacklogCount, 10) : settings.minBacklogCount,
        generationTime: body.generationTime || settings.generationTime,
        timezone: body.timezone || settings.timezone,
        autoGenerationEnabled: body.autoGenerationEnabled !== undefined ? Boolean(body.autoGenerationEnabled) : settings.autoGenerationEnabled,
        contentPillars: body.contentPillars || settings.contentPillars,
        captionLengthPreference: body.captionLengthPreference || settings.captionLengthPreference,
        hashtagCountMin: body.hashtagCountMin !== undefined ? parseInt(body.hashtagCountMin, 10) : settings.hashtagCountMin,
        hashtagCountMax: body.hashtagCountMax !== undefined ? parseInt(body.hashtagCountMax, 10) : settings.hashtagCountMax
      }
    });

    return NextResponse.json({ settings: updated });
  } catch (err: any) {
    console.error("Failed to update social settings:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
