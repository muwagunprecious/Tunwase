import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Creates a reusable Nodemailer transport for Gmail SMTP
 */
export function getMailTransporter() {
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE !== "false";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Dispatches an email via Gmail SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const transporter = getMailTransporter();
    const from = process.env.SMTP_FROM || `Adetunwase Adenle, Operating Manager, Animation Hub <${process.env.SMTP_USER || ""}>`;

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Email dispatch failed:", error);
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

/**
 * Verifies SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = getMailTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP verify error:", error);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderEmailParagraph(paragraph: string): string {
  const safe = escapeHtml(paragraph).replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    const cleanUrl = url.replace(/[),.;]+$/, "");
    return `<a href="${cleanUrl}" style="color:#111111;text-decoration:underline;font-weight:600;">${cleanUrl}</a>${url.slice(cleanUrl.length)}`;
  });
  return `<p style="margin:0 0 18px 0;">${safe.replace(/\n/g, "<br>")}</p>`;
}

/** Formats approved outreach as a professional black-and-white Animation Hub email. */
export function formatDesignerPromptEmailHtml(title: string, bodyContent: string): string {
  const safeTitle = escapeHtml(title);
  const sections = bodyContent.split("\n\n").map((paragraph) => {
    if (paragraph.startsWith("### ")) {
      return `<h2 style="margin:28px 0 12px;font-size:15px;line-height:1.3;letter-spacing:.04em;text-transform:uppercase;color:#111;border-bottom:2px solid #111;padding-bottom:8px;">${escapeHtml(paragraph.slice(4))}</h2>`;
    }
    if (paragraph.startsWith("- ")) {
      const items = paragraph.split("\n").map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item.replace(/^- /, ""))}</li>`).join("");
      return `<ul style="margin:0 0 18px;padding-left:22px;">${items}</ul>`;
    }
    if (/^\d+\. /.test(paragraph)) {
      const items = paragraph.split("\n").map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item.replace(/^\d+\. /, ""))}</li>`).join("");
      return `<ol style="margin:0 0 18px;padding-left:22px;">${items}</ol>`;
    }
    return renderEmailParagraph(paragraph);
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:34px 16px;background:#f1f1ef;font-family:Georgia,'Times New Roman',serif;color:#111;line-height:1.7;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #111;box-shadow:8px 8px 0 #111;">
    <div style="height:12px;background:#111;"></div>
    <div style="padding:30px 34px 24px;border-bottom:1px solid #111;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#555;margin-bottom:18px;">ANIMATION HUB</div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:34px;height:34px;background:#111;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;line-height:34px;text-align:center;">AH</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.04em;color:#555;">Creative work. African stories. Global reach.</div>
      </div>
      <h1 style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:25px;line-height:1.2;letter-spacing:-.02em;color:#111;">${safeTitle}</h1>
    </div>
    <div style="padding:34px;font-size:16px;">
      ${sections}
    </div>
    <div style="padding:20px 34px;border-top:1px solid #111;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#555;">
      Adetunwase Adenle<br>Operating Manager, Animation Hub
    </div>
  </div>
</body>
</html>`;
}

