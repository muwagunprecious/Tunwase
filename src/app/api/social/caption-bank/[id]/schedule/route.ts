import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { scheduledDate, scheduledTime, timezone } = body;

    if (!scheduledDate) {
      return NextResponse.json({ error: "scheduledDate is required" }, { status: 400 });
    }

    const updated = await prisma.captionBankItem.update({
      where: { id: params.id },
      data: {
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime || "09:00",
        timezone: timezone || "Africa/Lagos",
        status: "scheduled"
      }
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("Schedule caption error:", err);
    return NextResponse.json({ error: "Failed to schedule caption" }, { status: 500 });
  }
}
