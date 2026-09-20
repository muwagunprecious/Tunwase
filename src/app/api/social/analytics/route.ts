import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateContentGaps, getEngineSettings } from "@/lib/social/daily-caption-generator";
import { ensureWritingProfile } from "@/lib/social/editor-learning-loop";

export async function GET() {
  try {
    const settings = await getEngineSettings();
    const profile = await ensureWritingProfile();
    const gaps = await calculateContentGaps();

    // Counts by status
    const statusCountsRaw = await prisma.captionBankItem.groupBy({
      by: ["status"],
      _count: { _all: true }
    });

    const statusCounts: Record<string, number> = {
      ready_for_review: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      rejected: 0,
      draft: 0
    };

    for (const item of statusCountsRaw) {
      statusCounts[item.status] = item._count._all;
    }

    const activeBacklog =
      (statusCounts.ready_for_review || 0) +
      (statusCounts.approved || 0) +
      (statusCounts.scheduled || 0);

    // Recent jobs
    const recentJobs = await prisma.contentGenerationJob.findMany({
      take: 5,
      orderBy: { startedAt: "desc" }
    });

    // Recent editor edits
    const recentEdits = await prisma.contentEdit.findMany({
      take: 6,
      orderBy: { timestamp: "desc" },
      include: {
        captionItem: { select: { title: true, contentPillar: true } }
      }
    });

    return NextResponse.json({
      backlog: {
        activeCount: activeBacklog,
        targetMinimum: settings.minBacklogCount,
        isHealthy: activeBacklog >= settings.minBacklogCount,
        statusCounts
      },
      contentGaps: gaps,
      learnedRules: JSON.parse(profile.learnedRulesJson || "[]"),
      recentJobs,
      recentEdits
    });
  } catch (err: any) {
    console.error("Failed to fetch social analytics:", err);
    return NextResponse.json({ error: "Failed to fetch social analytics" }, { status: 500 });
  }
}
