import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL } from "@/lib/groq";
import { polishHumanContent } from "@/lib/agents/content-cleaner";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" }
    });

    const parsed = projects.map((p) => ({
      ...p,
      milestones: JSON.parse(p.milestonesJson || "[]"),
      risks: JSON.parse(p.risksJson || "[]"),
      decisions: JSON.parse(p.decisionsJson || "[]")
    }));

    return NextResponse.json({ projects: parsed });
  } catch (error: any) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, entity, objective, prompt } = body;

    if (!name || !objective) {
      return NextResponse.json({ error: "Name and objective are required" }, { status: 400 });
    }

    // AI Project Architecture Generator if requested
    let milestones: any[] = [];
    let risks: any[] = [];
    let decisions: any[] = [];
    let successMetrics = "Milestone delivery on schedule.";

    if (prompt) {
      const aiPrompt = `You are Adetunwase Adenle's AI Project Manager.
Create a structured project breakdown for:
Project Name: "${name}"
Entity: ${entity || "ANIMATION_HUB"}
Objective: "${objective}"
Context: "${prompt}"

Generate:
1. 4 chronological milestones with target dates (relative to today).
2. 2 realistic project risks with severity and mitigation.
3. 1 initial architecture decision with rationale.
4. Success metrics.

STRICT RULE: NO EM DASHES.

Return JSON in this format:
{
  "milestones": [
    { "title": "Milestone 1", "targetDate": "YYYY-MM-DD", "completed": false }
  ],
  "risks": [
    { "risk": "Description of risk", "severity": "High", "probability": "Medium", "mitigation": "Mitigation step" }
  ],
  "decisions": [
    { "decision": "Key architectural choice", "date": "YYYY-MM-DD", "reason": "Strategic reason" }
  ],
  "successMetrics": "Clear measurable metric"
}`;

      try {
        const completion = await groq.chat.completions.create({
          model: PRIMARY_MODEL,
          messages: [{ role: "user", content: aiPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.5
        });

        const parsedAI = JSON.parse(completion.choices[0]?.message?.content || "{}");
        milestones = parsedAI.milestones || [];
        risks = parsedAI.risks || [];
        decisions = parsedAI.decisions || [];
        successMetrics = parsedAI.successMetrics || successMetrics;
      } catch (e) {
        console.warn("AI project generation fallback:", e);
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        entity: entity || "ANIMATION_HUB",
        objective,
        expectedOutcome: body.expectedOutcome || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        budget: body.budget || null,
        successMetrics,
        milestonesJson: JSON.stringify(milestones),
        risksJson: JSON.stringify(risks),
        decisionsJson: JSON.stringify(decisions),
        status: "ACTIVE",
        healthScore: 85
      }
    });

    return NextResponse.json({
      project: {
        ...project,
        milestones,
        risks,
        decisions
      }
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, healthScore, healthReason, newMilestone, postMortem } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let milestones = JSON.parse(existing.milestonesJson || "[]");
    if (newMilestone) {
      milestones.push(newMilestone);
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(healthScore !== undefined && { healthScore }),
        ...(healthReason && { healthReason }),
        ...(newMilestone && { milestonesJson: JSON.stringify(milestones) }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      project: {
        ...updated,
        milestones
      }
    });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
