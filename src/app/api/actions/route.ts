import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const actionItems = await prisma.actionItem.findMany({
      orderBy: { createdAt: "desc" }
    });

    const needsApproval = actionItems.filter((a) => a.status === "NEEDS_APPROVAL");
    const autoCompleted = actionItems.filter((a) => a.status === "AUTO_COMPLETED");
    const waiting = actionItems.filter((a) => a.status === "WAITING");

    return NextResponse.json({
      actionItems,
      needsApproval,
      autoCompleted,
      waiting
    });
  } catch (error: any) {
    console.error("Fetch actions error:", error);
    return NextResponse.json({ error: "Failed to fetch action items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, decision } = await req.json(); // decision: "APPROVE" | "REJECT"

    if (!id || !decision) {
      return NextResponse.json({ error: "ID and decision are required" }, { status: 400 });
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
        executedAt: decision === "APPROVE" ? new Date() : null
      }
    });

    return NextResponse.json({ actionItem: updated });
  } catch (error: any) {
    console.error("Action decision error:", error);
    return NextResponse.json({ error: "Failed to update action item" }, { status: 500 });
  }
}
