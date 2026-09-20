import { NextRequest, NextResponse } from "next/server";
import { recordHumanEdit } from "@/lib/social/editor-learning-loop";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { captionBankId, originalAiCaption, editedCaption, finalCaption } = body;

    if (!captionBankId || !originalAiCaption || !editedCaption) {
      return NextResponse.json(
        { error: "captionBankId, originalAiCaption, and editedCaption are required" },
        { status: 400 }
      );
    }

    const editRecord = await recordHumanEdit({
      captionBankId,
      originalAiCaption,
      editedCaption,
      finalCaption
    });

    return NextResponse.json({ success: true, editRecord });
  } catch (err: any) {
    console.error("Feedback recording error:", err);
    return NextResponse.json({ error: "Failed to record editor feedback" }, { status: 500 });
  }
}
