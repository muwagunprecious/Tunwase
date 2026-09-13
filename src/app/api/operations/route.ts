import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { determineWhatShouldIDoNow } from "@/lib/agents/chief-of-staff";
import { groq, PRIMARY_MODEL } from "@/lib/groq";
import { polishHumanContent } from "@/lib/agents/content-cleaner";

export async function GET() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch active operational data
    const [tasks, projects, actionItems, reminders, followUps, opportunities, drafts] = await Promise.all([
      prisma.task.findMany({ orderBy: { priority: "asc" } }),
      prisma.project.findMany({ where: { status: "ACTIVE" } }),
      prisma.actionItem.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.reminder.findMany({ where: { status: "PENDING" } }),
      prisma.relationshipFollowUp.findMany({ where: { status: "PENDING" } }),
      prisma.opportunity.findMany({ where: { status: { in: ["NEW", "PURSUING"] } } }),
      prisma.contentDraft.findMany({ where: { status: { in: ["Draft", "Approved"] } } })
    ]);

    const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < today && t.status !== "COMPLETED");
    const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
    const criticalTasks = tasks.filter((t) => t.priority === "CRITICAL" && t.status !== "COMPLETED");

    // Compute "What should I do now?"
    const whatToDoNow = await determineWhatShouldIDoNow();

    // Parse projects
    const parsedProjects = projects.map((p) => ({
      ...p,
      milestones: JSON.parse(p.milestonesJson || "[]"),
      risks: JSON.parse(p.risksJson || "[]"),
      decisions: JSON.parse(p.decisionsJson || "[]")
    }));

    // Action center summary
    const needsApprovalCount = actionItems.filter((a) => a.status === "NEEDS_APPROVAL").length;
    const waitingCount = actionItems.filter((a) => a.status === "WAITING").length;
    const autoCompletedCount = actionItems.filter((a) => a.status === "AUTO_COMPLETED").length;

    return NextResponse.json({
      todayStr,
      metrics: {
        totalTasks: tasks.length,
        inProgressCount: inProgressTasks.length,
        overdueCount: overdueTasks.length,
        blockedCount: blockedTasks.length,
        criticalCount: criticalTasks.length,
        activeProjectsCount: projects.length,
        pendingRemindersCount: reminders.length,
        pendingFollowUpsCount: followUps.length,
        needsApprovalCount,
        waitingCount,
        autoCompletedCount,
        opportunitiesCount: opportunities.length,
        readyDraftsCount: drafts.length
      },
      whatToDoNow,
      attentionRequired: [
        ...blockedTasks.map((t) => ({ type: "BLOCKED", text: `Task blocked: "${t.title}" (${t.projectName || "General"})`, id: t.id })),
        ...overdueTasks.map((t) => ({ type: "OVERDUE", text: `Overdue task: "${t.title}" (Due ${t.deadline?.toLocaleDateString()})`, id: t.id })),
        ...followUps.filter((f) => f.waitingOnThem).map((f) => ({ type: "WAITING_ON_OTHER", text: `Awaiting from ${f.personName} (${f.company}): ${f.commitmentsByThem}`, id: f.id }))
      ],
      projects: parsedProjects,
      tasks: tasks.slice(0, 8),
      reminders: reminders.slice(0, 5),
      opportunities: opportunities.slice(0, 3)
    });
  } catch (error: any) {
    console.error("Operations summary error:", error);
    return NextResponse.json({ error: "Failed to generate operations summary", details: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type } = await req.json(); // "DAILY_OPS" | "END_OF_DAY" | "WEEKLY"
    const todayStr = new Date().toISOString().split("T")[0];

    const tasks = await prisma.task.findMany();
    const projects = await prisma.project.findMany();
    const followUps = await prisma.relationshipFollowUp.findMany();

    const prompt = `You are Adetunwase Adenle's AI Chief of Staff.
Generate an executive ${type === "END_OF_DAY" ? "End-of-Day Review" : type === "WEEKLY" ? "Weekly Operations Review" : "Daily Operations Briefing"} for ${todayStr}.

Operational Context:
- Active Projects: ${projects.map((p) => `${p.name} (Health: ${p.healthScore}%)`).join("; ")}
- Critical & In-Progress Tasks: ${tasks.filter((t) => t.status === "IN_PROGRESS" || t.priority === "CRITICAL").map((t) => t.title).join("; ")}
- Completed Tasks: ${tasks.filter((t) => t.status === "COMPLETED").map((t) => t.title).join("; ") || "None"}
- Pending Follow-Ups: ${followUps.map((f) => `${f.personName}: ${f.commitmentsByThem || f.commitmentsByAdetun}`).join("; ")}

STRICT RULES:
1. No em dashes (—). Use commas, colons, or clean sentences.
2. Direct, sharp, operational clarity. No corporate fluff.
3. Identify operational blind spots or bottlenecks honestly.

Return JSON in this format:
{
  "priorities": ["Priority 1", "Priority 2", "Priority 3"],
  "overdue": ["Item requiring attention 1", "Item 2"],
  "bottlenecks": ["Operational bottleneck 1"],
  "blindSpots": ["Blind spot or observation"],
  "aiReflection": "Direct 2-sentence Chief of Staff assessment and recommended focus for tomorrow."
}`;

    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

    const review = await prisma.operationsReview.create({
      data: {
        date: todayStr,
        type: type || "DAILY_OPS",
        prioritiesJson: JSON.stringify(parsed.priorities || []),
        overdueJson: JSON.stringify(parsed.overdue || []),
        bottlenecksJson: JSON.stringify(parsed.bottlenecks || []),
        healthSummaryJson: JSON.stringify({ activeProjects: projects.length, totalTasks: tasks.length }),
        blindSpotsJson: JSON.stringify(parsed.blindSpots || []),
        aiReflection: polishHumanContent(parsed.aiReflection || "Operational flow is steady. Maintain velocity on critical path animation deliverables.").polished
      }
    });

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error("Operations review error:", error);
    return NextResponse.json({ error: "Failed to create operations review" }, { status: 500 });
  }
}
