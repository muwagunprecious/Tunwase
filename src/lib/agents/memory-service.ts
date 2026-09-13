import { prisma } from "../prisma";
import { sendEmail, formatDesignerPromptEmailHtml } from "../email-service";

export interface PendingEmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface PendingOutreachCampaignPayload {
  campaign: string;
  drafts: Array<{
    to: string;
    subject: string;
    body: string;
    html?: string;
  }>;
}

/**
 * Stores a standing instruction permanently in the system memory
 */
export async function storeInstruction(content: string, category = "INSTRUCTION"): Promise<void> {
  try {
    await prisma.memory.create({
      data: {
        category,
        entity: "PERSONAL",
        content,
        source: "Adetunwase Direct Directive",
        isActive: true,
      },
    });
  } catch (err) {
    console.error("Failed to store instruction in memory:", err);
  }
}

/**
 * Retrieves all active standing instructions
 */
export async function getActiveInstructions(): Promise<string[]> {
  try {
    const memories = await prisma.memory.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    return memories.map((m) => m.content);
  } catch {
    return [];
  }
}

/**
 * Queues an email for explicit user approval before dispatching
 */
export async function createPendingEmailDraft(payload: PendingEmailPayload) {
  return await prisma.actionItem.create({
    data: {
      title: `Send Email to ${payload.to}: ${payload.subject}`,
      description: payload.body.slice(0, 200),
      type: "SEND_EMAIL",
      status: "NEEDS_APPROVAL",
      riskLevel: "MEDIUM",
      payloadJson: JSON.stringify(payload),
    },
  });
}

/**
 * Queues a generated outreach batch for one explicit approval.
 */
export async function createPendingOutreachCampaign(payload: PendingOutreachCampaignPayload) {
  return await prisma.actionItem.create({
    data: {
      title: `Approve outreach campaign: ${payload.campaign}`,
      description: `${payload.drafts.length} personalized email draft(s) awaiting approval.`,
      type: "OUTREACH_CAMPAIGN",
      status: "NEEDS_APPROVAL",
      riskLevel: "HIGH",
      payloadJson: JSON.stringify(payload),
    },
  });
}

/**
 * Dispatches the latest pending email action upon user approval
 */
export async function approveAndSendLatestEmail(): Promise<{
  success: boolean;
  recipient?: string;
  subject?: string;
  messageId?: string;
  error?: string;
}> {
  try {
    const pending = await prisma.actionItem.findFirst({
      where: {
        type: { in: ["SEND_EMAIL", "OUTREACH_CAMPAIGN"] },
        status: "NEEDS_APPROVAL",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!pending || !pending.payloadJson) {
      return { success: false, error: "No pending email draft awaiting approval." };
    }

    const payload = JSON.parse(pending.payloadJson) as PendingEmailPayload | PendingOutreachCampaignPayload;

    if (pending.type === "OUTREACH_CAMPAIGN") {
      const campaign = payload as PendingOutreachCampaignPayload;
      let sentCount = 0;
      let failedCount = 0;

      for (const draft of campaign.drafts) {
        const result = await sendEmail({
          to: draft.to,
          subject: draft.subject,
          text: draft.body,
          html: draft.html,
        });
        if (result.success) sentCount += 1;
        else failedCount += 1;
      }

      await prisma.actionItem.update({
        where: { id: pending.id },
        data: {
          status: "APPROVED",
          executedAt: new Date(),
          description: `${sentCount} sent, ${failedCount} failed in ${campaign.campaign}.`,
        },
      });

      return {
        success: failedCount === 0,
        recipient: `${sentCount} campaign recipient(s)`,
        subject: campaign.campaign,
        error: failedCount > 0 ? `${sentCount} sent, ${failedCount} failed.` : undefined,
      };
    }

    const emailPayload = payload as PendingEmailPayload;
    const result = await sendEmail({
      to: emailPayload.to,
      subject: emailPayload.subject,
      text: emailPayload.body,
      html: emailPayload.html || formatDesignerPromptEmailHtml(emailPayload.subject, emailPayload.body),
    });

    if (result.success) {
      await prisma.actionItem.update({
        where: { id: pending.id },
        data: {
          status: "APPROVED",
          executedAt: new Date(),
        },
      });

      return {
        success: true,
        recipient: emailPayload.to,
        subject: emailPayload.subject,
        messageId: result.messageId,
      };
    } else {
      return {
        success: false,
        recipient: emailPayload.to,
        error: result.error,
      };
    }
  } catch (err: any) {
    console.error("Error approving and dispatching email:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
