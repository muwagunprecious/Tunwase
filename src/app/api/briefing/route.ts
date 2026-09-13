import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL } from "@/lib/groq";
import { polishHumanContent, stripAsterisksForPlaintext } from "@/lib/agents/content-cleaner";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    let briefing = await prisma.dailyBriefing.findFirst({
      where: { date: today },
      orderBy: { createdAt: "desc" }
    });

    if (!briefing) {
      // Find the most recent briefing
      briefing = await prisma.dailyBriefing.findFirst({
        orderBy: { createdAt: "desc" }
      });
    }

    if (!briefing) {
      return NextResponse.json({ briefing: null });
    }

    return NextResponse.json({
      briefing: {
        ...briefing,
        threeKeyNews: JSON.parse(briefing.threeKeyNewsJson || "[]"),
        twoRelevantTrends: JSON.parse(briefing.twoRelevantTrendsJson || "[]"),
        oneContentOpp: JSON.parse(briefing.oneContentOppJson || "{}"),
        recommendedDrafts: JSON.parse(briefing.recommendedDraftsJson || "[]")
      }
    });
  } catch (error: any) {
    console.error("Fetch briefing error:", error);
    return NextResponse.json({ error: "Failed to fetch briefing" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Fetch facts & trends for context
    const trends = await prisma.trend.findMany({ take: 3, orderBy: { discoveredAt: "desc" } });
    const facts = await prisma.knowledgeFact.findMany({ take: 5 });

    const prompt = `Generate Adetunwase Adenle's morning executive briefing for ${today}.
Adetunwase is a multiple Guinness World Record holder, founder of Animation Hub (African animation studio and training academy), and founder of the Adetunwase Adenle Foundation.

Context:
Trends: ${trends.map((t) => t.title).join(", ")}
Facts: ${facts.map((f) => f.fact).join("; ")}

Structure:
1. Executive headline (1 sentence, sharp, visionary).
2. 3 Things Worth Knowing (high-impact, verified news).
3. 2 Relevant Trends (actionable for Animation Hub & Foundation).
4. 1 Standout Content Opportunity (platform, hook, angle).
5. 2 Recommended Drafts (1 LinkedIn, 1 X).

CRITICAL RULE: STRICTLY NO EM DASHES (—). Use commas or periods. No buzzwords.

Return JSON format:
{
  "executiveHeadline": "...",
  "threeKeyNews": ["News 1", "News 2", "News 3"],
  "twoRelevantTrends": ["Trend 1", "Trend 2"],
  "oneContentOpp": {
    "platform": "LinkedIn",
    "hook": "...",
    "angle": "...",
    "estimatedEngagement": "High"
  },
  "recommendedDrafts": [
    {
      "platform": "LINKEDIN",
      "topic": "...",
      "status": "Draft",
      "content": "..."
    },
    {
      "platform": "X",
      "topic": "...",
      "status": "Draft",
      "content": "..."
    }
  ],
  "meetingsOverview": "Review strategic collaboration opportunities."
}`;

    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Clean em dashes and strip asterisks from drafts and news
    const cleanedDrafts = (parsed.recommendedDrafts || []).map((d: any) => ({
      ...d,
      content: stripAsterisksForPlaintext(polishHumanContent(d.content || "").polished)
    }));

    const cleanedNews = (parsed.threeKeyNews || []).map((n: string) => polishHumanContent(n).polished);
    const cleanedTrends = (parsed.twoRelevantTrends || []).map((t: string) => polishHumanContent(t).polished);

    const newBriefing = await prisma.dailyBriefing.create({
      data: {
        date: today,
        executiveHeadline: polishHumanContent(parsed.executiveHeadline || "Executive Morning Intelligence").polished,
        threeKeyNewsJson: JSON.stringify(cleanedNews),
        twoRelevantTrendsJson: JSON.stringify(cleanedTrends),
        oneContentOppJson: JSON.stringify(parsed.oneContentOpp || {}),
        recommendedDraftsJson: JSON.stringify(cleanedDrafts),
        meetingsOverview: polishHumanContent(parsed.meetingsOverview || "").polished
      }
    });

    return NextResponse.json({
      briefing: {
        ...newBriefing,
        threeKeyNews: parsed.threeKeyNews || [],
        twoRelevantTrends: parsed.twoRelevantTrends || [],
        oneContentOpp: parsed.oneContentOpp || {},
        recommendedDrafts: cleanedDrafts
      }
    });
  } catch (error: any) {
    console.error("Generate briefing error:", error);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
