import { NextRequest, NextResponse } from "next/server";
import { sendEmail, verifyEmailConnection } from "@/lib/email-service";

export async function GET() {
  const isConnected = await verifyEmailConnection();
  return NextResponse.json({
    status: isConnected ? "connected" : "disconnected",
    account: process.env.SMTP_USER || "professorprecious03@gmail.com",
    service: "Gmail SMTP"
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, text, html, replyTo } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Recipient 'to' and 'subject' are required." },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      replyTo
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to dispatch email.", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      sentTo: to,
      subject
    });
  } catch (err: any) {
    console.error("Email API route error:", err);
    return NextResponse.json(
      { error: "Internal server error dispatching email.", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
