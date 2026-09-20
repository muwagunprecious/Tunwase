import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const rejectionReason = body.reason || "Rejected by editor";

    const updated = await prisma.captionBankItem.update({
      where: { id: params.id },
      data: {
        status: "rejected",
        rejectionReason
      }
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("Reject caption error:", err);
    return NextResponse.json({ error: "Failed to reject caption" }, { status: 500 });
  }
}
