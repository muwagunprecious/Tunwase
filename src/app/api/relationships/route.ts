import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const followUps = await prisma.relationshipFollowUp.findMany({
      orderBy: { nextFollowUpDate: "asc" }
    });

    const waitingOnThem = followUps.filter((f) => f.waitingOnThem && f.status === "PENDING");
    const myCommitments = followUps.filter((f) => !!f.commitmentsByAdetun && f.status === "PENDING");

    return NextResponse.json({
      followUps,
      waitingOnThem,
      myCommitments
    });
  } catch (error: any) {
    console.error("Fetch relationships error:", error);
    return NextResponse.json({ error: "Failed to fetch relationships" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { personName, company, role, commitmentsByAdetun, commitmentsByThem, waitingOnThem, nextFollowUpDate, notes } = body;

    if (!personName || !company) {
      return NextResponse.json({ error: "Person name and company are required" }, { status: 400 });
    }

    const created = await prisma.relationshipFollowUp.create({
      data: {
        personName,
        company,
        role: role || null,
        commitmentsByAdetun: commitmentsByAdetun || null,
        commitmentsByThem: commitmentsByThem || null,
        waitingOnThem: waitingOnThem ?? false,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        notes: notes || null,
        status: "PENDING"
      }
    });

    return NextResponse.json({ followUp: created });
  } catch (error: any) {
    console.error("Create follow-up error:", error);
    return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, waitingOnThem, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updated = await prisma.relationshipFollowUp.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(waitingOnThem !== undefined && { waitingOnThem }),
        ...(notes && { notes }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ followUp: updated });
  } catch (error: any) {
    console.error("Update follow-up error:", error);
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  }
}
