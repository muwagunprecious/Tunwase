import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const copyType = body.type || "ALL"; // CAPTION, HASHTAGS, ALL

    const item = await prisma.captionBankItem.findUnique({
      where: { id: params.id }
    });

    if (!item) {
      return NextResponse.json({ error: "Caption not found" }, { status: 404 });
    }

    let textToCopy = "";
    if (copyType === "CAPTION") {
      textToCopy = item.caption;
    } else if (copyType === "HASHTAGS") {
      textToCopy = item.hashtags.join(" ");
    } else {
      textToCopy = `${item.caption}\n\n${item.hashtags.join(" ")}`;
    }

    return NextResponse.json({
      success: true,
      textToCopy,
      copyType
    });
  } catch (err: any) {
    console.error("Copy handler error:", err);
    return NextResponse.json({ error: "Failed to process copy action" }, { status: 500 });
  }
}
