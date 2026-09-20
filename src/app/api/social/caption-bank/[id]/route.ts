import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.captionBankItem.findUnique({
      where: { id: params.id },
      include: {
        context: true,
        edits: { orderBy: { timestamp: "desc" } },
        performance: true
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Caption item not found" }, { status: 400 });
    }

    return NextResponse.json({ item });
  } catch (err: any) {
    console.error("Failed to fetch caption item:", err);
    return NextResponse.json({ error: "Failed to fetch caption item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { title, caption, hashtags, priority, status, scheduledDate, scheduledTime } = body;

    const updated = await prisma.captionBankItem.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(caption !== undefined && { caption }),
        ...(hashtags !== undefined && { hashtags }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(scheduledDate !== undefined && { scheduledDate: scheduledDate ? new Date(scheduledDate) : null }),
        ...(scheduledTime !== undefined && { scheduledTime })
      }
    });

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error("Failed to update caption item:", err);
    return NextResponse.json({ error: "Failed to update caption item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.captionBankItem.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete caption item:", err);
    return NextResponse.json({ error: "Failed to delete caption item" }, { status: 500 });
  }
}
