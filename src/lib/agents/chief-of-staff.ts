import { groq, PRIMARY_MODEL, FAST_MODEL } from "../groq";
import { prisma } from "../prisma";
import { polishHumanContent } from "./content-cleaner";

export interface WhatShouldIDoNowResult {
  topAction: string;
  taskTitle: string;
  projectName?: string;
  priority: string;
  deadline?: string;
  whyThisIsImportant: string;
  nextSteps: string[];
  blockerWarning?: string;
}

export interface ParsedTaskResult {
  title: string;
  description?: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  deadline?: Date;
  entity: "PERSONAL" | "ANIMATION_HUB" | "FOUNDATION";
  projectName?: string;
  reminderTrigger?: Date;
  reminderType?: string;
}

/**
 * "What Should I Do Now?" Dynamic Priority Engine
 */
export async function determineWhatShouldIDoNow(): Promise<WhatShouldIDoNowResult> {
  // Fetch active tasks, overdue tasks, blockers, and projects
  const activeTasks = await prisma.task.findMany({
    where: { status: { in: ["IN_PROGRESS", "BLOCKED", "PLANNED", "INBOX"] } },
    orderBy: [
      { priority: "asc" }, // CRITICAL -> HIGH -> MEDIUM -> LOW
      { deadline: "asc" }
    ],
    take: 10
  });

  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    take: 5
  });

  const blockedTask = activeTasks.find((t) => t.status === "BLOCKED");
  const criticalTask = activeTasks.find((t) => t.priority === "CRITICAL" && t.status !== "BLOCKED");
  const highTask = activeTasks.find((t) => t.priority === "HIGH");

  const chosenTask = blockedTask || criticalTask || highTask || activeTasks[0];

  if (!chosenTask) {
    return {
      topAction: "Conduct Strategic Review or Prepare Today's Content",
      taskTitle: "No urgent operational bottlenecks detected",
      priority: "MEDIUM",
      whyThisIsImportant: "All current tasks are in good standing. This is an ideal window for high-leverage strategic planning or creative direction at Animation Hub.",
      nextSteps: [
        "Review 12-month Animation Hub expansion roadmap.",
        "Check Content Studio for today's thought leadership drafts.",
        "Review upcoming partnership opportunities in Opportunity Radar."
      ]
    };
  }

  const prompt = `You are Adetunwase Adenle's AI Chief of Staff.
Analyze this active operational state and explain why the selected task is the single highest-priority action for Adetunwase right now.

Current Date: ${new Date().toISOString().split("T")[0]}
Selected Task:
- Title: ${chosenTask.title}
- Priority: ${chosenTask.priority}
- Status: ${chosenTask.status}
- Project: ${chosenTask.projectName || "General"}
- Deadline: ${chosenTask.deadline ? chosenTask.deadline.toISOString() : "Not set"}
- Notes: ${chosenTask.notes || "None"}

Other Active Tasks in Pipeline:
${activeTasks.slice(0, 4).map((t) => `- [${t.priority}] ${t.title} (${t.status})`).join("\n")}

STRICT RULES:
1. No em dashes (—). Use commas, colons, or clean sentences.
2. Direct, sharp, executive Chief of Staff tone.
3. Clearly answer: "Why is this the single most important thing to do right now?"

Return JSON format:
{
  "whyThisIsImportant": "Direct explanation of why completing or unblocking this task drives maximum leverage and unblocks downstream work.",
  "nextSteps": [
    "Step 1: Immediate concrete action",
    "Step 2: Follow-up coordination",
    "Step 3: Verification"
  ],
  "blockerWarning": "Optional note if this is blocking other work"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return {
      topAction: chosenTask.title,
      taskTitle: chosenTask.title,
      projectName: chosenTask.projectName || undefined,
      priority: chosenTask.priority,
      deadline: chosenTask.deadline ? chosenTask.deadline.toLocaleDateString() : undefined,
      whyThisIsImportant: polishHumanContent(parsed.whyThisIsImportant || "Completing this task directly addresses the highest-risk operational bottleneck.").polished,
      nextSteps: (parsed.nextSteps || [
        "Open project assets and review latest version.",
        "Coordinate with the technical lead to confirm resolution.",
        "Mark task as completed in the Chief of Staff dashboard."
      ]).map((s: string) => polishHumanContent(s).polished),
      blockerWarning: parsed.blockerWarning ? polishHumanContent(parsed.blockerWarning).polished : undefined
    };
  } catch (err) {
    console.warn("Chief of staff LLM fallback:", err);
    return {
      topAction: chosenTask.title,
      taskTitle: chosenTask.title,
      projectName: chosenTask.projectName || undefined,
      priority: chosenTask.priority,
      deadline: chosenTask.deadline ? chosenTask.deadline.toLocaleDateString() : undefined,
      whyThisIsImportant: `This task is marked as ${chosenTask.priority} priority and is scheduled for near-term delivery. Resolving it prevents downstream delays for ${chosenTask.projectName || "your team"}.`,
      nextSteps: [
        "Inspect the current deliverable on the studio workstation.",
        "Give feedback to the team lead.",
        "Confirm next milestone deadline."
      ]
    };
  }
}

/**
 * Natural Language Task and Reminder Extraction
 */
export async function parseNaturalTask(input: string): Promise<ParsedTaskResult> {
  const prompt = `Extract a structured operational task from this statement for Adetunwase Adenle:
"${input}"

Current reference date: ${new Date().toISOString()}

Determine:
1. title: Clean, concise task title (e.g., "Call John", "Send Animation Hub proposal")
2. description: Any additional context
3. priority: "CRITICAL", "HIGH", "MEDIUM", or "LOW"
4. deadline: ISO date string if mentioned, or null
5. entity: "PERSONAL", "ANIMATION_HUB", or "FOUNDATION"
6. reminderTrigger: ISO date string for when a reminder should fire, or null
7. reminderType: "ONE_TIME", "DATE", "RELATIVE", "FOLLOW_UP", or "DEADLINE"

Return JSON in this format:
{
  "title": "Call John",
  "description": "Follow up on streaming co-production agreement",
  "priority": "HIGH",
  "deadline": "2026-09-15T15:00:00.000Z",
  "entity": "ANIMATION_HUB",
  "reminderTrigger": "2026-09-15T09:00:00.000Z",
  "reminderType": "DATE"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      title: parsed.title || input,
      description: parsed.description || undefined,
      priority: parsed.priority || "MEDIUM",
      deadline: parsed.deadline ? new Date(parsed.deadline) : undefined,
      entity: parsed.entity || "PERSONAL",
      reminderTrigger: parsed.reminderTrigger ? new Date(parsed.reminderTrigger) : undefined,
      reminderType: parsed.reminderType || "DATE"
    };
  } catch (err) {
    console.warn("Task parse fallback:", err);
    return {
      title: input.replace(/(remind me to|i need to|task:)\s*/i, "").trim(),
      priority: "MEDIUM",
      entity: input.toLowerCase().includes("foundation") ? "FOUNDATION" : input.toLowerCase().includes("animation hub") ? "ANIMATION_HUB" : "PERSONAL"
    };
  }
}

/**
 * Decision Room Evaluator (Option A vs Option B)
 */
export async function evaluateDecision(
  topic: string,
  optionA: string,
  optionB: string,
  entity: string = "PERSONAL"
): Promise<any> {
  const prompt = `You are Adetunwase Adenle's AI Chief of Staff and Strategic Advisor.
Evaluate this executive decision rigorously.

Decision Topic: "${topic}"
Option A: "${optionA}"
Option B: "${optionB}"
Entity: ${entity}

Context:
Adetunwase is a multiple Guinness World Record holder, founder of Animation Hub (African animation studio and training academy), and founder of the Adetunwase Adenle Foundation.
He values long-term intellectual property ownership, local talent empowerment, high operational velocity, and capital discipline.

Evaluate across:
1. Cost (CapEx vs OpEx)
2. Time to value
3. Risk profile (execution and external factors)
4. Potential upside
5. Strategic alignment with Adetunwase's mission
6. Operational complexity

Make a definitive recommendation: Choose Option A or Option B and state clearly:
"Here is what I would choose and why."

CRITICAL RULE: STRICTLY NO EM DASHES (—). Use commas, colons, or clean sentences.

Return JSON in this format:
{
  "criteria": {
    "cost": "Analysis of cost...",
    "time": "Analysis of time...",
    "risk": "Analysis of risk...",
    "potentialUpside": "Analysis of upside...",
    "strategicAlignment": "Analysis of alignment...",
    "operationalComplexity": "Analysis of complexity..."
  },
  "recommendation": "Choose Option A (or Option B): concise summary",
  "rationale": "Direct, principled rationale explaining why this choice serves Adetunwase best.",
  "implementationPlan": [
    "Step 1: Immediate action",
    "Step 2: Risk mitigation",
    "Step 3: Milestone review"
  ]
}`;

  const completion = await groq.chat.completions.create({
    model: PRIMARY_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5
  });

  const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

  return {
    criteria: parsed.criteria,
    recommendation: polishHumanContent(parsed.recommendation || "").polished,
    rationale: polishHumanContent(parsed.rationale || "").polished,
    implementationPlan: (parsed.implementationPlan || []).map((s: string) => polishHumanContent(s).polished)
  };
}
