import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updated = await prisma.captionBankItem.update({
      where: { id: params.id },
      data: { status: "approved" }
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("Approve caption error:", err);
    return NextResponse.json({ error: "Failed to approve caption" }, { status: 500 });
  }
}
