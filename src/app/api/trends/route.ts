import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL } from "@/lib/groq";
import { executeWebSearch } from "@/lib/agents/web-search";
import { polishHumanContent } from "@/lib/agents/content-cleaner";

export async function GET() {
  try {
    const trends = await prisma.trend.findMany({
      orderBy: { discoveredAt: "desc" }
    });

    const parsedTrends = trends.map((t) => ({
      ...t,
      angles: JSON.parse(t.anglesJson || "[]")
    }));

    return NextResponse.json({ trends: parsedTrends });
  } catch (error: any) {
    console.error("Trends fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    const query = topic || "African animation creative tech news";
    const webResults = await executeWebSearch(query);

    const contextSnippet = webResults.map((r) => `${r.title}: ${r.snippet}`).join("\n");

    const prompt = `Analyze this trend for Adetunwase Adenle (Guinness World Record artist, Animation Hub founder, Foundation founder).
Trend context:
${contextSnippet || topic}

Generate a structured Trend Radar analysis:
1. Category (AI & Tech, Animation, Creative Industry, Youth & Education, African Business)
2. Relevance score to Adetunwase personally (1-100)
3. Relevance score to Animation Hub (1-100)
4. Relevance score to Adetunwase Adenle Foundation (1-100)
5. 3 specific, authentic angles Adetunwase can speak about. DO NOT use em dashes.

Return JSON in this format:
{
  "title": "Trend Title",
  "category": "Animation",
  "summary": "2-sentence summary of the trend",
  "relevanceAdetun": 92,
  "relevanceAnimationHub": 95,
  "relevanceFoundation": 80,
  "timelinessScore": 90,
  "brandFitScore": 94,
  "angles": [
    "Angle 1: Specific hook or perspective",
    "Angle 2: Animation Hub connection",
    "Angle 3: Foundation or youth education angle"
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const cleanedSummary = polishHumanContent(parsed.summary || "").polished;
    const cleanedAngles = (parsed.angles || []).map((a: string) => polishHumanContent(a).polished);

    const created = await prisma.trend.create({
      data: {
        title: parsed.title || topic,
        category: parsed.category || "Creative Industry",
        summary: cleanedSummary,
        relevanceAdetun: parsed.relevanceAdetun || 85,
        relevanceAnimationHub: parsed.relevanceAnimationHub || 80,
        relevanceFoundation: parsed.relevanceFoundation || 75,
        timelinessScore: parsed.timelinessScore || 88,
        brandFitScore: parsed.brandFitScore || 90,
        anglesJson: JSON.stringify(cleanedAngles),
        source: webResults[0]?.sourceName || "Industry Feed",
        sourceUrl: webResults[0]?.url || "https://news.google.com"
      }
    });

    return NextResponse.json({
      trend: {
        ...created,
        angles: cleanedAngles
      }
    });
  } catch (error: any) {
    console.error("Trend analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze trend" }, { status: 500 });
  }
}
