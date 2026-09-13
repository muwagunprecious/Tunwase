import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNaturalTask } from "@/lib/agents/chief-of-staff";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const entity = searchParams.get("entity");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (entity && entity !== "ALL") where.entity = entity;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { deadline: "asc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Natural Language Task Creation (e.g. "Remind me to send proposal to John tomorrow")
    if (body.naturalInput) {
      const parsed = await parseNaturalTask(body.naturalInput);

      const task = await prisma.task.create({
        data: {
          title: parsed.title,
          description: parsed.description || null,
          priority: parsed.priority || "MEDIUM",
          deadline: parsed.deadline || null,
          entity: parsed.entity || "PERSONAL",
          status: "INBOX",
          personResponsible: "Adetunwase Adenle"
        }
      });

      // Also create reminder if trigger was extracted
      if (parsed.reminderTrigger) {
        await prisma.reminder.create({
          data: {
            taskId: task.id,
            title: `Reminder: ${parsed.title}`,
            triggerAt: parsed.reminderTrigger,
            type: parsed.reminderType || "DATE",
            priority: parsed.priority || "MEDIUM"
          }
        });
      }

      return NextResponse.json({ task, reminderCreated: !!parsed.reminderTrigger });
    }

    // Standard Structured Creation
    const { title, description, priority, deadline, entity, projectName, projectId, personResponsible, notes } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        entity: entity || "PERSONAL",
        projectName: projectName || null,
        projectId: projectId || null,
        personResponsible: personResponsible || "Adetunwase Adenle",
        notes: notes || null,
        status: "INBOX"
      }
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, priority, notes, deadline } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(notes && { notes }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ task: updated });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
