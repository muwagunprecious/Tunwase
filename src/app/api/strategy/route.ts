import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateDecision } from "@/lib/agents/chief-of-staff";
import { groq, PRIMARY_MODEL } from "@/lib/groq";
import { polishHumanContent } from "@/lib/agents/content-cleaner";

export async function GET() {
  try {
    const decisions = await prisma.decisionRecord.findMany({
      orderBy: { decidedAt: "desc" }
    });

    const roadmaps = await prisma.strategicRoadmap.findMany({
      orderBy: { updatedAt: "desc" }
    });

    const parsedDecisions = decisions.map((d) => ({
      ...d,
      criteria: JSON.parse(d.criteriaJson || "{}")
    }));

    const parsedRoadmaps = roadmaps.map((r) => ({
      ...r,
      roadmap12Month: JSON.parse(r.roadmap12MonthJson || "[]"),
      quarterlyGoals: JSON.parse(r.quarterlyGoalsJson || "[]"),
      monthlyMilestones: JSON.parse(r.monthlyMilestonesJson || "[]"),
      keyMetrics: JSON.parse(r.keyMetricsJson || "[]"),
      next7Days: JSON.parse(r.next7DaysJson || "[]")
    }));

    return NextResponse.json({
      decisions: parsedDecisions,
      roadmaps: parsedRoadmaps
    });
  } catch (error: any) {
    console.error("Fetch strategy error:", error);
    return NextResponse.json({ error: "Failed to fetch strategy data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, optionA, optionB, entity, roadmapObjective } = body;

    // Action 1: Decision Room Evaluation
    if (action === "evaluate_decision") {
      if (!topic || !optionA || !optionB) {
        return NextResponse.json({ error: "Topic, optionA, and optionB are required" }, { status: 400 });
      }

      const evalResult = await evaluateDecision(topic, optionA, optionB, entity);

      const decisionRecord = await prisma.decisionRecord.create({
        data: {
          topic,
          optionA,
          optionB,
          entity: entity || "PERSONAL",
          criteriaJson: JSON.stringify(evalResult.criteria),
          recommendation: evalResult.recommendation,
          rationale: evalResult.rationale,
          status: "DECIDED"
        }
      });

      return NextResponse.json({
        decision: {
          ...decisionRecord,
          criteria: evalResult.criteria,
          implementationPlan: evalResult.implementationPlan
        }
      });
    }

    // Action 2: 12-Month Strategic Roadmap Generator
    if (action === "generate_roadmap") {
      const targetEntity = entity || "ANIMATION_HUB";
      const objective = roadmapObjective || "Scale production capacity and establish pan-African IP distribution.";

      const prompt = `You are Adetunwase Adenle's Chief of Staff and Strategic Advisor.
Build an executive 12-Month Strategic Roadmap for ${targetEntity}.
Objective: "${objective}"

Generate:
1. Current state summary.
2. 4-phase 12-month roadmap (Q1 to Q4).
3. 4 Quarterly Goals.
4. 3 immediate monthly milestones.
5. 3 Key Metrics.
6. Required resources.
7. Next 7 Days action list.

CRITICAL RULE: STRICTLY NO EM DASHES. Use commas, colons, or clean sentences.

Return JSON format:
{
  "currentState": "...",
  "roadmap12Month": [
    { "phase": "Q1: ...", "focus": "..." },
    { "phase": "Q2: ...", "focus": "..." },
    { "phase": "Q3: ...", "focus": "..." },
    { "phase": "Q4: ...", "focus": "..." }
  ],
  "quarterlyGoals": ["Q1 Goal", "Q2 Goal", "Q3 Goal", "Q4 Goal"],
  "monthlyMilestones": ["M1 Milestone", "M2 Milestone", "M3 Milestone"],
  "keyMetrics": ["Metric 1", "Metric 2", "Metric 3"],
  "requiredResources": "...",
  "next7Days": ["Action 1", "Action 2", "Action 3"]
}`;

      const completion = await groq.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

      const roadmap = await prisma.strategicRoadmap.create({
        data: {
          entity: targetEntity,
          title: `${targetEntity === "ANIMATION_HUB" ? "Animation Hub" : targetEntity === "FOUNDATION" ? "Foundation" : "Personal"} 12-Month Strategic Roadmap`,
          objective,
          currentState: polishHumanContent(parsed.currentState || "").polished,
          roadmap12MonthJson: JSON.stringify(parsed.roadmap12Month || []),
          quarterlyGoalsJson: JSON.stringify(parsed.quarterlyGoals || []),
          monthlyMilestonesJson: JSON.stringify(parsed.monthlyMilestones || []),
          keyMetricsJson: JSON.stringify(parsed.keyMetrics || []),
          requiredResourcesJson: polishHumanContent(parsed.requiredResources || "").polished,
          next7DaysJson: JSON.stringify(parsed.next7Days || [])
        }
      });

      return NextResponse.json({
        roadmap: {
          ...roadmap,
          roadmap12Month: parsed.roadmap12Month,
          quarterlyGoals: parsed.quarterlyGoals,
          monthlyMilestones: parsed.monthlyMilestones,
          keyMetrics: parsed.keyMetrics,
          next7Days: parsed.next7Days
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Strategy API error:", error);
    return NextResponse.json({ error: "Failed to execute strategic action", details: error?.message }, { status: 500 });
  }
}
