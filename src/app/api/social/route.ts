import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const posts = await prisma.socialPost.findMany({
      orderBy: { postedAt: "desc" }
    });

    const styleProfile = await prisma.styleProfile.findFirst({
      where: { entity: "PERSONAL" }
    });

    // Compute metrics
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((acc, p) => acc + p.likes, 0);
    const totalComments = posts.reduce((acc, p) => acc + p.comments, 0);
    const avgEngagement = totalPosts > 0 ? (posts.reduce((acc, p) => acc + p.engagementRate, 0) / totalPosts).toFixed(1) : 0;

    // Categorical breakdown
    const categories: Record<string, number> = {};
    const entityBreakdown: Record<string, number> = { PERSONAL: 0, ANIMATION_HUB: 0, FOUNDATION: 0 };

    for (const p of posts) {
      categories[p.category] = (categories[p.category] || 0) + 1;
      entityBreakdown[p.entity] = (entityBreakdown[p.entity] || 0) + 1;
    }

    // Fatigue warning
    let fatigueWarning = null;
    const recentFive = posts.slice(0, 5);
    const animationHubCount = recentFive.filter((p) => p.entity === "ANIMATION_HUB").length;
    if (animationHubCount >= 3) {
      fatigueWarning = "You have posted about Animation Hub in 3 of your last 5 updates. Your audience may respond well to a personal storytelling reflection or a Foundation youth update today.";
    }

    // High vs low performers
    const highPerformers = posts.filter((p) => p.isHighPerformer);
    const regularPosts = posts.filter((p) => !p.isHighPerformer);

    return NextResponse.json({
      posts,
      metrics: {
        totalPosts,
        totalLikes,
        totalComments,
        avgEngagement: `${avgEngagement}%`,
        categories,
        entityBreakdown,
        fatigueWarning
      },
      highPerformers,
      regularPosts,
      styleProfile: styleProfile
        ? {
            ...styleProfile,
            hookPatterns: JSON.parse(styleProfile.hookPatterns || "[]"),
            closingPatterns: JSON.parse(styleProfile.closingPatterns || "[]"),
            learnedRules: JSON.parse(styleProfile.learnedRulesJson || "[]")
          }
        : null
    });
  } catch (error: any) {
    console.error("Social intelligence error:", error);
    return NextResponse.json({ error: "Failed to fetch social intelligence" }, { status: 500 });
  }
}
