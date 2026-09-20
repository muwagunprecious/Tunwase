import { groq, PRIMARY_MODEL, FAST_MODEL } from "../groq";
import { prisma } from "../prisma";
import { polishHumanContent } from "./content-cleaner";
import { executeWebSearch, WebSearchResult } from "./web-search";
import { researchProfessionalContact, ExecutiveDossier } from "./contact-research";
import { determineWhatShouldIDoNow, parseNaturalTask, evaluateDecision } from "./chief-of-staff";
import { scrapeTargetLeads, ScrapedLead } from "./openleads-scraper";
import { sendEmail, formatDesignerPromptEmailHtml } from "../email-service";
import {
  storeInstruction,
  getActiveInstructions,
  createPendingEmailDraft,
  createPendingOutreachCampaign,
  approveAndSendLatestEmail
} from "./memory-service";

const HUMAN_RESPONSE_RULES = `
HUMAN VOICE RULES:
- Sound genuinely human, natural, and conversational. Talk like a real person, a trusted assistant, or a close teammate chatting directly with Adetunwase.
- ONE-WORD REPLIES: When a question, command, or situation only calls for a simple confirmation, acknowledgment, or short answer, reply with ONE WORD (or 2-3 words at most). For example: "Done.", "Yes.", "No.", "On it.", "Sure.", "Alright.", "Got it.", "Cool.", "Anytime.", "Not yet." Do NOT force long sentences or multiple paragraphs when a single word or short phrase is enough.
- NO BIG ENGLISH: Use simple, plain, everyday English words. Never use fancy, pretentious, academic, or heavy corporate jargon (avoid words like "facilitate", "leverage", "utilize", "subsequently", "paramount", "dossier", "orchestrate", "imperative", "comprehensive", "methodology", "commence"). Speak naturally, clearly, and down-to-earth.
- NOT TOO STRUCTURED: Avoid rigid formatting. Do NOT force markdown headers (###), bold labels, or bullet points onto everyday conversational replies. Speak in natural, relaxed sentences or paragraphs. Only use a short list if Adetunwase specifically asks for a list or if it genuinely makes a complex multi-item answer clearer.
- NO BOT CLICHES: Never say "As an AI...", "I would be happy to help", "Certainly!", "Here is a breakdown", "Let me know if you need anything else".
- NO UNSOLICITED ADVICE OR SUMMARIES: Never attach unrequested takeaways, recommendations, or conversational filler ("Would you like me to...", "Feel free to ask..."). Answer only what was asked.
- DIRECT & HONEST: If you do not know something, just say "I don't know" or "Not sure yet."
- Never use em dashes (—), en dashes (–), or double hyphens (--).
`;

function buildStructuredEmailFallback(message: string, facts: string[], research: string[] = []): { subject: string; body: string } {
  const lowerMessage = message.toLowerCase();
  const roleMatch = message.match(/selected\s+(?:as|for)\s+(?:the\s+)?(?:role\s+of\s+)?(.+?)(?:\s+(?:of|at)\s+animation\s+hub)\b/i);
  const animationFact = facts.find((fact) => /animation hub.*studio|animation hub.*academy/i.test(fact))
    || "Animation Hub is a Lagos-based animation studio and creative training academy.";
  const serviceFact = facts.find((fact) => /2d|3d|visual effects|motion graphics/i.test(fact))
    || "Animation Hub develops animation, visual storytelling, and creative technology projects.";

  if (/proposal|collaboration|partner|exhibition|showcase|display|use .* centre|use .* center/i.test(lowerMessage)) {
    const researchNote = research.length > 0 ? ` I also reviewed the available public information before preparing this request.` : "";
    return {
      subject: "Proposal to showcase Slumart at your exhibition centre",
      body: `Hello,\n\nI am writing to explore a possible collaboration with your exhibition centre. We would like to discuss showcasing Slumart artworks at your venue. Slumart is the art project named in this request, and we would be glad to share the full curatorial and exhibition details for your review.${researchNote}\n\nI am Adetunwase Adenle, a Nigerian artist, educator, and four-time Guinness World Record holder. ${animationFact} ${serviceFact}\n\nCould we arrange a short conversation about your venue's requirements, available dates, exhibition format, and the next steps for submitting the work?\n\nBest,\nAdetunwase Adenle\nOperating Manager, Animation Hub`
    };
  }

  const role = roleMatch?.[1]?.trim().replace(/\bcto\b/i, "CTO") || "a leadership role";

  return {
    subject: `Your selection as ${role} at Animation Hub`,
    body: `Hello,\n\nI am pleased to let you know that you have been selected for ${role} at Animation Hub.\n\nI am Adetunwase Adenle, a Nigerian artist, educator, and four-time Guinness World Record holder. ${animationFact} ${serviceFact}\n\nWe will share the next steps with you shortly.\n\nBest,\nAdetunwase Adenle\nOperating Manager, Animation Hub`
  };
}

function isWrongEmailType(body: string, request: string): boolean {
  const lowerBody = body.toLowerCase();
  const lowerRequest = request.toLowerCase();
  const asksForProposal = /proposal|collaboration|partner|exhibition|showcase|display|venue|centre|center/.test(lowerRequest);
  const soundsLikeAppointment = /selected as|appointed as|employment offer|job offer|leadership role/.test(lowerBody);
  return asksForProposal && soundsLikeAppointment;
}

function isInstructionEcho(body: string, request: string, recipient: string): boolean {
  const normalizedBody = body.toLowerCase().replace(/\s+/g, " ").trim();
  const normalizedRequest = request.toLowerCase().replace(/\s+/g, " ").trim();
  return !normalizedBody ||
    normalizedBody.includes("i need you to send an email") ||
    normalizedBody.includes("draft an email") ||
    normalizedBody.includes("mailto:") ||
    normalizedBody.includes(recipient.toLowerCase()) ||
    normalizedBody === normalizedRequest;
}

export interface AssistantResponse {
  content: string;
  rawContent?: string;
  toolsUsed: string[];
  sources?: WebSearchResult[];
  suggestedActions: string[];
  generatedDraft?: {
    platform: string;
    topic: string;
    content: string;
    hashtags: string;
    entity: string;
  };
  outreachDrafts?: Array<{
    to: string;
    company: string;
    subject: string;
    body: string;
  }>;
  contactDossier?: ExecutiveDossier;
  leads?: ScrapedLead[];
}

export async function processUserMessage(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  contextMode?: string,
  campaignLeads: ScrapedLead[] = []
): Promise<AssistantResponse> {
  const toolsUsed: string[] = [];
  const lowerMsg = message.toLowerCase();

  // 0.0 Email Approval Handler (User approving a pending draft)
  const isApproval =
    lowerMsg === "approved" ||
    lowerMsg === "approve" ||
    lowerMsg === "yes" ||
    lowerMsg === "send it" ||
    lowerMsg === "yes send it" ||
    lowerMsg === "yes, send it" ||
    lowerMsg === "go ahead" ||
    lowerMsg === "proceed" ||
    lowerMsg === "confirm" ||
    lowerMsg === "confirmed" ||
    lowerMsg.startsWith("approved") ||
    lowerMsg.includes("approve the email") ||
    lowerMsg.includes("send the email");

  if (isApproval) {
    toolsUsed.push("Email Approval Execution Agent", "Nodemailer Engine");
    const result = await approveAndSendLatestEmail();
    if (result.success) {
      return {
        content: `Sent! The email to ${result.recipient} has been delivered.`,
        toolsUsed,
        suggestedActions: []
      };
    } else if (result.error && result.error.includes("No pending email draft")) {
      // If user typed approved but there is no draft pending
      if (lowerMsg === "approved" || lowerMsg === "approve" || lowerMsg === "send it" || lowerMsg === "yes send it") {
        return {
          content: `There is no draft waiting right now. Tell me who you want to email and what to say, and I will write it.`,
          toolsUsed,
          suggestedActions: []
        };
      }
    } else {
      return {
        content: `Could not send the email to ${result.recipient || "the recipient"}. Error: ${result.error}`,
        toolsUsed,
        suggestedActions: []
      };
    }
  }

  // 0.0b Persistent Instruction & Directive Storage
  const isInstructionStorage =
    lowerMsg.includes("store the instruction") ||
    lowerMsg.includes("store this instruction") ||
    lowerMsg.includes("store instruction") ||
    lowerMsg.includes("remember this instruction") ||
    lowerMsg.includes("save this instruction") ||
    lowerMsg.includes("listen to instruction") ||
    lowerMsg.includes("remember that") ||
    lowerMsg.startsWith("instruction:") ||
    lowerMsg.startsWith("remember:");

  if (isInstructionStorage) {
    toolsUsed.push("Persistent Memory & Directive Storage");
    let instructionToStore = message;
    if (lowerMsg.startsWith("instruction:")) {
      instructionToStore = message.replace(/^instruction:\s*/i, "").trim();
    } else if (lowerMsg.startsWith("remember:")) {
      instructionToStore = message.replace(/^remember:\s*/i, "").trim();
    }
    await storeInstruction(instructionToStore, "INSTRUCTION");

    return {
      content: "Saved.",
      toolsUsed,
      suggestedActions: []
    };
  }

  // 0. Chief of Staff: "What should I do now?"
  if (
    lowerMsg.includes("what should i do now") ||
    lowerMsg.includes("what do i need to do") ||
    lowerMsg.includes("what needs my attention") ||
    lowerMsg.includes("what is stuck") ||
    lowerMsg.includes("what should i focus on") ||
    lowerMsg.includes("what's my biggest priority")
  ) {
    toolsUsed.push("Chief of Staff Priority Engine", "Operations Monitor");
    const priorityResult = await determineWhatShouldIDoNow();

    const responseText = `👑 **Adetunwase's Priority Focus Right Now:**

**Highest-Leverage Action:** ${priorityResult.topAction}
${priorityResult.projectName ? `**Project:** ${priorityResult.projectName}` : ""}
**Priority Level:** ${priorityResult.priority} ${priorityResult.deadline ? `• **Deadline:** ${priorityResult.deadline}` : ""}

**Why this is the most important thing to do right now:**
${priorityResult.whyThisIsImportant}

${priorityResult.blockerWarning ? `⚠️ **Bottleneck Alert:** ${priorityResult.blockerWarning}\n` : ""}
**Recommended Execution Steps:**
${priorityResult.nextSteps.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}

Would you like me to prepare the deliverable or mark this as in progress?`;

    return {
      content: polishHumanContent(responseText).polished,
      toolsUsed,
      suggestedActions: [
        "Mark task as in progress",
        "Show all blocked tasks",
        "Open Operations Dashboard",
        "Prepare meeting brief"
      ]
    };
  }

  // 0.1 Chief of Staff: Conversational Task & Reminder Creation
  if (
    (lowerMsg.startsWith("remind me to") ||
      lowerMsg.startsWith("i need to") ||
      lowerMsg.startsWith("add task:") ||
      lowerMsg.includes("set a reminder to")) &&
    !lowerMsg.includes("research")
  ) {
    toolsUsed.push("Natural Task & Reminder Agent");
    const parsed = await parseNaturalTask(message);

    const task = await prisma.task.create({
      data: {
        title: parsed.title,
        description: parsed.description || null,
        priority: parsed.priority,
        deadline: parsed.deadline || null,
        entity: parsed.entity,
        status: "INBOX",
        personResponsible: "Adetunwase Adenle"
      }
    });

    if (parsed.reminderTrigger) {
      await prisma.reminder.create({
        data: {
          taskId: task.id,
          title: `Reminder: ${parsed.title}`,
          triggerAt: parsed.reminderTrigger,
          type: parsed.reminderType || "DATE",
          priority: parsed.priority
        }
      });
    }

    const responseText = `Added "${task.title}" to your tasks${task.deadline ? ` (due ${task.deadline.toLocaleDateString()})` : ""}.`;

    return {
      content: polishHumanContent(responseText).polished,
      toolsUsed,
      suggestedActions: [
        "View active tasks",
        "What should I do now?",
        "Assign to team member",
        "Create project from task"
      ]
    };
  }

  // 0.2 Chief of Staff: Meeting Debrief & Commitment Tracking
  if (
    lowerMsg.includes("meeting finished with") ||
    lowerMsg.includes("just met with") ||
    lowerMsg.includes("just had a meeting with")
  ) {
    toolsUsed.push("Relationship & Commitments Tracker", "Chief of Staff Debrief");

    const debriefPrompt = `Extract operational commitments from this meeting debrief for Adetunwase:
"${message}"

Extract:
1. personName: Name of person met
2. company: Company/affiliation
3. commitmentsByAdetun: What Adetunwase promised to do (or null)
4. commitmentsByThem: What the other person promised to do (or null)
5. waitingOnThem: boolean (true if waiting on them to send contract, email, etc.)
6. followUpDays: number (estimated days until next follow-up, default 3)
7. summary: 2-sentence summary of the meeting outcome

CRITICAL RULE: NO EM DASHES.

Return JSON format:
{
  "personName": "...",
  "company": "...",
  "commitmentsByAdetun": "...",
  "commitmentsByThem": "...",
  "waitingOnThem": true,
  "followUpDays": 3,
  "summary": "..."
}`;

    let parsedDebrief: any = {};
    try {
      const completion = await groq.chat.completions.create({
        model: FAST_MODEL,
        messages: [{ role: "user", content: debriefPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      });
      parsedDebrief = JSON.parse(completion.choices[0]?.message?.content || "{}");

      // Save follow-up in DB
      if (parsedDebrief.personName) {
        await prisma.relationshipFollowUp.create({
          data: {
            personName: parsedDebrief.personName,
            company: parsedDebrief.company || "Partner Organization",
            commitmentsByAdetun: parsedDebrief.commitmentsByAdetun || null,
            commitmentsByThem: parsedDebrief.commitmentsByThem || null,
            waitingOnThem: parsedDebrief.waitingOnThem ?? false,
            nextFollowUpDate: new Date(Date.now() + (parsedDebrief.followUpDays || 3) * 24 * 60 * 60 * 1000),
            notes: parsedDebrief.summary || null,
            status: "PENDING"
          }
        });

        // Queue action item if Adetunwase has a deliverable
        if (parsedDebrief.commitmentsByAdetun) {
          await prisma.actionItem.create({
            data: {
              title: `Follow-up for ${parsedDebrief.personName}: ${parsedDebrief.commitmentsByAdetun}`,
              description: `Meeting outcome: ${parsedDebrief.summary}`,
              type: "SEND_EMAIL",
              status: "NEEDS_APPROVAL",
              riskLevel: "MEDIUM"
            }
          });
        }
      }
    } catch (e) {
      console.warn("Debrief parse warning:", e);
    }

    const responseText = `Meeting debrief processed, Adetunwase.

🤝 **Contact:** ${parsedDebrief.personName || "Partner"} (${parsedDebrief.company || "Affiliated Organization"})
📝 **Summary:** ${parsedDebrief.summary || "Meeting completed."}

${parsedDebrief.commitmentsByAdetun ? `📌 **You Promised:** ${parsedDebrief.commitmentsByAdetun} (Queued in Action Center)` : ""}
${parsedDebrief.commitmentsByThem ? `⏳ **They Promised:** ${parsedDebrief.commitmentsByThem} (Tracking as waiting item)` : ""}
🔔 **Next Follow-Up:** Scheduled in ${parsedDebrief.followUpDays || 3} days.

Would you like me to draft the follow-up email or turn key insights into a public LinkedIn story?`;

    return {
      content: polishHumanContent(responseText).polished,
      toolsUsed,
      suggestedActions: [
        "Draft follow-up email",
        "Turn meeting into LinkedIn post",
        "Open Action Center",
        "What should I do now?"
      ]
    };
  }

  // 0.2 Autonomous Gmail SMTP Email Dispatch Agent
  const isEmailActionQuery =
    lowerMsg.includes("send email") ||
    lowerMsg.includes("send an email") ||
    lowerMsg.includes("send this email") ||
    lowerMsg.includes("draft an email") ||
    lowerMsg.includes("draft email") ||
    lowerMsg.includes("write an email") ||
    lowerMsg.includes("write email") ||
    lowerMsg.includes("compose an email") ||
    lowerMsg.includes("compose email") ||
    lowerMsg.includes("reply to this email") ||
    lowerMsg.includes("email this to") ||
    lowerMsg.includes("dispatch email") ||
    (lowerMsg.includes("app password") && lowerMsg.includes("gmail")) ||
    (lowerMsg.includes("email") && lowerMsg.includes("@") && lowerMsg.includes("send")) ||
    (lowerMsg.includes("email") && lowerMsg.includes("visual"));

  if (isEmailActionQuery) {
    toolsUsed.push("Autonomous Gmail SMTP Dispatcher", "Nodemailer Engine");

    // Check if recipient email address is present in the message
    const allEmails = message.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi) || [];
    // The address in the user's request is the intended recipient, even when it
    // matches the configured sender account during testing or self-send workflows.
    const targetRecipient = allEmails[0] || null;

    // If recipient is present: Queue draft and show preview for explicit approval (NEVER send without approval)
    if (targetRecipient) {
      const facts = await prisma.knowledgeFact.findMany({
        where: {
          entity: { in: ["PERSONAL", "ANIMATION_HUB"] },
          privacy: { not: "Private" }
        },
        orderBy: { confidence: "desc" },
        take: 12
      });
      const factText = facts.map((fact) => fact.fact);
      const researchQuery = message
        .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      let emailResearch: WebSearchResult[] = [];
      if (/slumart|exhibition|showcase|venue|artwork|collaboration|proposal/i.test(researchQuery)) {
        emailResearch = await executeWebSearch(`${researchQuery} official project company venue`);
        toolsUsed.push("Context Research Agent");
      }
      const requestsShortEmail = /\b(short|brief|concise|quick)\b/i.test(message);
      const lengthInstruction = requestsShortEmail
        ? "Keep it short, around 80 to 120 words."
        : "Make it detailed and well structured, around 250 to 400 words. Explain the purpose, context, value, proposed collaboration, and next step. Do not pad it with repetition.";
      const emailPrompt = `Write the email the user requested.

USER REQUEST:
${message}

SENDER:
Adetunwase Adenle, Operating Manager, Animation Hub

VERIFIED PUBLIC FACTS YOU MAY USE:
${facts.map((fact) => `- ${fact.fact}`).join("\n")}

ONLINE CONTEXT:
${emailResearch.length > 0 ? emailResearch.map((result) => `- ${result.title}: ${result.snippet} (${result.url})`).join("\n") : "No reliable online context found. Do not invent details."}

Rules:
- Follow the user's request exactly. Do not turn it into a design or UI prompt.
- Identify the email type from the request: appointment, introduction, proposal, partnership, follow-up, reply, invitation, announcement, update, request, apology, or another type.
- Match the email structure to that type. A role appointment needs the role, reason, next step, and any terms the user supplied. A follow-up should refer to the prior context. A proposal should state the value and one clear ask.
- If the user is announcing a role or appointment, state it clearly and professionally.
- Briefly introduce Adetunwase and Animation Hub only when requested.
- Use short, natural sentences and plain words.
- ${lengthInstruction}
- Preserve and include useful links supplied by the user. Do not invent links.
- Do not invent salary, start date, contract terms, benefits, achievements, or company facts.
- Sign exactly as: Adetunwase Adenle, Operating Manager, Animation Hub.
- No em dashes, hype, fake urgency, or placeholders.

Return JSON only:
{"subject":"clear email subject","body":"complete email body"}`;

      const fallbackDraft = buildStructuredEmailFallback(message, factText, emailResearch.map((result) => result.snippet));
      let subject = fallbackDraft.subject;
      let emailBody = fallbackDraft.body;
      try {
        const completion = await groq.chat.completions.create({
          model: FAST_MODEL,
          messages: [{ role: "user", content: emailPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.35,
          max_tokens: requestsShortEmail ? 300 : 800
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const candidateSubject = String(parsed.subject || "").trim();
        const candidateBody = String(parsed.body || "").trim();
        if (candidateSubject && candidateBody && !isInstructionEcho(candidateBody, message, targetRecipient) && !isWrongEmailType(candidateBody, message)) {
          subject = candidateSubject;
          emailBody = candidateBody;
        }
      } catch (error) {
        console.warn("Email draft generation fallback:", error);
      }

      // Queue draft in actionItems awaiting approval
      await createPendingEmailDraft({
        to: targetRecipient,
        subject,
        body: emailBody,
        html: formatDesignerPromptEmailHtml(subject, emailBody)
      });

      const previewSnippet = emailBody.length > 350 ? emailBody.slice(0, 350) + "..." : emailBody;

      const approvalPrompt =
        `Here is the draft:\n\n` +
        `**To:** ${targetRecipient}\n` +
        `**Subject:** ${subject}\n\n` +
        `${previewSnippet}\n\n` +
        `Reply "Approved" or "Send it" when you want me to send it.`;

      return {
        content: polishHumanContent(approvalPrompt).polished,
        toolsUsed: ["Draft Generator", "Approval Guard"],
        suggestedActions: ["Approved", "Cancel"]
      };
    }

    const formattedResponse = `Tell me the recipient and what you want the email to say. I will draft it, show you the full message, and wait for your approval before sending it through Gmail.`;

    return {
      content: polishHumanContent(formattedResponse).polished,
      toolsUsed,
      suggestedActions: []
    };
  }

  // 0.2 OpenLeads B2B & Business Lead Scraper Intent
  // e.g. "I need art company in the usa, their emails and phone number", "marketers in miami", "scrape leads for..."
  const isLeadScraperQuery =
    (lowerMsg.includes("i need") ||
      lowerMsg.includes("find") ||
      lowerMsg.includes("get") ||
      lowerMsg.includes("scrape") ||
      lowerMsg.includes("extract") ||
      lowerMsg.includes("search for") ||
      lowerMsg.includes("give me") ||
      lowerMsg.includes("list of") ||
      lowerMsg.includes("looking for") ||
      lowerMsg.includes("leads") ||
      lowerMsg.includes("b2b")) &&
    (lowerMsg.includes("company") ||
      lowerMsg.includes("companies") ||
      lowerMsg.includes("agency") ||
      lowerMsg.includes("agencies") ||
      lowerMsg.includes("studio") ||
      lowerMsg.includes("studios") ||
      lowerMsg.includes("marketer") ||
      lowerMsg.includes("marketers") ||
      lowerMsg.includes("firm") ||
      lowerMsg.includes("firms") ||
      lowerMsg.includes("gallery") ||
      lowerMsg.includes("galleries") ||
      lowerMsg.includes("dentist") ||
      lowerMsg.includes("lawyer") ||
      lowerMsg.includes("phone number") ||
      lowerMsg.includes("phone numbers") ||
      lowerMsg.includes("phone") ||
      lowerMsg.includes("email") ||
      lowerMsg.includes("emails") ||
      lowerMsg.includes("contacts") ||
      lowerMsg.includes("leads") ||
      lowerMsg.includes("openleads")) &&
    !lowerMsg.includes("who is ") &&
    !lowerMsg.includes("research this person") &&
    !lowerMsg.includes("what should i do now");

  if (isLeadScraperQuery) {
    toolsUsed.push("OpenLeads B2B Intelligence Engine", "Global Business Directory", "Verified Contact Finder");

    // Use fast LLM extraction to understand exact requested business type and location
    let keyword = "companies";
    let location = "Global";
    let projectName = "African Creative & Animation Projects";

    try {
      const extractionRes = await groq.chat.completions.create({
        model: FAST_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an executive contact extraction parser.
Analyze the user's message and extract:
1. keyword: The specific business type, profession, or industry requested (e.g. "art company", "marketing agencies", "animation studio", "law firm", "dentist", "contemporary gallery").
2. location: The target city, state, country, or region requested (e.g. "USA", "Miami", "Lagos", "London", "California"). If no location is mentioned, default to "Global".
3. projectName: The project, initiative, or strategic context mentioned, or "Animation Hub & Creative Initiatives" if unspecified.

Respond with JSON only:
{
  "keyword": "string",
  "location": "string",
  "projectName": "string"
}`
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const parsedJson = JSON.parse(extractionRes.choices[0]?.message?.content || "{}");
      if (parsedJson.keyword) keyword = parsedJson.keyword;
      if (parsedJson.location) location = parsedJson.location;
      if (parsedJson.projectName) projectName = parsedJson.projectName;
    } catch (e) {
      console.warn("LLM lead query parse error, falling back to heuristics:", e);
      if (lowerMsg.includes("art")) keyword = "art company";
      else if (lowerMsg.includes("marketing") || lowerMsg.includes("marketer")) keyword = "marketing agencies";
      if (lowerMsg.includes("usa") || lowerMsg.includes("united states")) location = "USA";
    }

    const scrapeResult = await scrapeTargetLeads({
      keyword,
      location,
      projectName,
      limit: 6
    });

    let leadTable = "";
    if (scrapeResult.leads.length > 0) {
      leadTable =
        `| Company | Phone Number | Business Email | Website | Deliverability |\n| :--- | :--- | :--- | :--- | :---: |\n` +
        scrapeResult.leads
          .map((l) => {
            const siteCell =
              l.website && l.website.startsWith("http")
                ? `[Visit Site](${l.website})`
                : `N/A`;
            return `| **${l.companyName}** | ${l.phone} | \`${l.email}\` | ${siteCell} | **${l.confidenceScore}%** |`;
          })
          .join("\n");
    } else {
      leadTable = `No public business records found matching "${keyword}" in ${location}. Try a nearby major metropolitan area or broader country scope.`;
    }

    const userAskedForFit =
      lowerMsg.includes("how does this fit") ||
      lowerMsg.includes("fit my") ||
      lowerMsg.includes("fit your") ||
      lowerMsg.includes("objectives") ||
      lowerMsg.includes("why relevant") ||
      lowerMsg.includes("relevance");

    const userAskedForNextSteps =
      lowerMsg.includes("next step") ||
      lowerMsg.includes("next action") ||
      lowerMsg.includes("what should i do next") ||
      lowerMsg.includes("how should i proceed");

    let responseText = `### B2B Lead Intelligence: ${keyword.toUpperCase()} in ${location.toUpperCase()}

Here are the verified business contacts found for **${keyword}** in **${location}**:

${leadTable}`;

    if (userAskedForFit && scrapeResult.leads.length > 0) {
      responseText += `\n\n### How These Fit Your Objectives\n` +
        scrapeResult.leads.slice(0, 3).map((l) => `- **${l.companyName}:** ${l.whyRelevantForProject}`).join("\n");
    }

    if (userAskedForNextSteps) {
      responseText += `\n\n### Recommended Next Steps\n` +
        `1. **Outreach:** Ask me to draft a custom cold outreach email for any company above.\n` +
        `2. **CSV Export:** Download this dataset via \`/api/leads?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&format=csv\`.`;
    }

    return {
      content: polishHumanContent(responseText).polished,
      toolsUsed,
      leads: scrapeResult.leads,
      suggestedActions: []
    };
  }

  // 0.3 Draft a personalized campaign for the most recent lead search.
  const isOutreachCampaignQuery =
    campaignLeads.length > 0 &&
    (lowerMsg.includes("draft") ||
      lowerMsg.includes("write") ||
      lowerMsg.includes("send") ||
      lowerMsg.includes("outreach") ||
      lowerMsg.includes("collaboration") ||
      lowerMsg.includes("pitch")) &&
    (lowerMsg.includes("email") ||
      lowerMsg.includes("message") ||
      lowerMsg.includes("them") ||
      lowerMsg.includes("companies") ||
      lowerMsg.includes("contacts"));

  if (isOutreachCampaignQuery) {
    toolsUsed.push("Personalized Outreach Writer", "Campaign Approval Guard");

    const drafts = await Promise.all(
      campaignLeads
        .filter((lead) => lead.email && lead.emailType !== "Inferred Pattern")
        .slice(0, 30)
        .map(async (lead) => {
          const firstName = lead.contactPerson && lead.contactPerson !== "Decision Maker"
            ? lead.contactPerson.split(/\s+/)[0]
            : "there";
          const prompt = `You write short, human B2B collaboration emails for Animation Hub. You are writing as Adetunwase Adenle, Operating Manager, Animation Hub.

User's campaign instructions:
${message}

Recipient data:
- Name: ${lead.contactPerson || "the team"}
- Company: ${lead.companyName}
- Role: ${lead.role}
- Category: ${lead.category}
- Location: ${lead.location}
- Relevance: ${lead.whyRelevantForProject}

Write one respectful collaboration email proposing a conversation with Animation Hub.
Use the recipient's company and real details only. Do not invent achievements, clients, or facts.
Keep it under 90 words, specific, warm, and low-pressure. Include one simple call to action.
Do not use em dashes, hype, fake claims, placeholders, or spam language.

Return JSON only:
{"subject":"short specific subject","body":"complete email body"}`;

          try {
            const completion = await groq.chat.completions.create({
              model: FAST_MODEL,
              messages: [{ role: "user", content: prompt }],
              response_format: { type: "json_object" },
              temperature: 0.6,
              max_tokens: 350
            });
            const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
            return {
              to: lead.email,
              company: lead.companyName,
              subject: parsed.subject || `Animation Hub and ${lead.companyName}`,
              body: parsed.body || `Hi ${firstName},\n\nI would like to explore a collaboration between Animation Hub and ${lead.companyName}. Would you be open to a short call?\n\nBest,\nAdetunwase Adenle\nOperating Manager, Animation Hub`
            };
          } catch (error) {
            console.warn("Outreach draft fallback:", error);
            return {
              to: lead.email,
              company: lead.companyName,
              subject: `Animation Hub and ${lead.companyName}`,
              body: `Hi ${firstName},\n\nI would like to explore a collaboration between Animation Hub and ${lead.companyName}. Would you be open to a short call?\n\nBest,\nAdetunwase Adenle\nOperating Manager, Animation Hub`
            };
          }
        })
    );

    if (!drafts.length) {
      return {
        content: "I could not prepare a campaign because the current results do not contain suitable published business email addresses.",
        toolsUsed,
        suggestedActions: ["Find leads with published emails"]
      };
    }

    await createPendingOutreachCampaign({
      campaign: "Animation Hub Collaboration Outreach",
      drafts: drafts.map(({ to, subject, body }) => ({
        to,
        subject,
        body,
        html: formatDesignerPromptEmailHtml(subject, body)
      }))
    });

    const preview = drafts.slice(0, 3).map((draft, index) =>
      `${index + 1}. **${draft.company}**\n   **Subject:** ${draft.subject}\n   ${draft.body}`
    ).join("\n\n");

    return {
      content: `### Outreach Campaign Drafted\n\nI prepared **${drafts.length} personalized collaboration email(s)** for Animation Hub.\n\n${preview}${drafts.length > 3 ? `\n\n_and ${drafts.length - 3} more draft(s) are ready._` : ""}\n\n**Approval required:** Reply **Approved** or **Send it** to send this batch through Gmail SMTP.`,
      toolsUsed,
      outreachDrafts: drafts,
      suggestedActions: ["Approved", "Rewrite the campaign", "Cancel"]
    };
  }

  // 1. Check if intent is Meeting Prep / Person / Contact Research
  if (
    lowerMsg.includes("research this person") ||
    lowerMsg.includes("prepare a dossier") ||
    lowerMsg.includes("contact info for") ||
    lowerMsg.includes("email of ") ||
    lowerMsg.includes("meeting with") ||
    lowerMsg.includes("prepare me for meeting") ||
    lowerMsg.startsWith("dossier on") ||
    lowerMsg.startsWith("prep me for") ||
    contextMode === "research"
  ) {
    toolsUsed.push("Professional Contact Research Agent", "Web Research Agent");
    
    // Cleanly extract target person name and company
    let cleaned = message
      .replace(/^(research this person|who is|find contact for|meeting with|prepare me for)[:\s]*/i, "")
      .trim();

    let targetName = cleaned;
    let targetCompany: string | undefined = undefined;

    // Separate any trailing question like "Why do they matter to Adetunwase?"
    const questionMatch = targetName.match(/^(.*?)(?:[.?]|\s+why\b|\s+what\b)/i);
    if (questionMatch && questionMatch[1]) {
      targetName = questionMatch[1].trim();
    }

    if (targetName.includes(",")) {
      const parts = targetName.split(",");
      targetName = parts[0].trim();
      targetCompany = parts.slice(1).join(",").trim();
    }

    if (!targetName || targetName.length < 2) {
      targetName = "Prospective Partner";
    }

    const dossier = await researchProfessionalContact(targetName, targetCompany);

    const systemPrompt = `You are Adetunwase Adenle's executive assistant.
You are presenting a researched dossier and meeting brief for: ${targetName}${targetCompany ? ` (${targetCompany})` : ""}.
Adetunwase is a multiple Guinness World Record holder, founder of Animation Hub (African animation studio & academy), and founder of the Adetunwase Adenle Foundation (youth arts empowerment).

STRICT FORMATTING & WRITING RULES:
1. ABSOLUTELY ZERO EM DASHES (—, –, --). Use colons (:), commas, or separate sentences.
2. ABSOLUTELY ZERO ASTERISK BULLETS. Do not write "* item". Always use standard hyphens "- item" or numbered lists "1. 2. 3.".
3. NEVER put commas immediately after bold labels. Write "**Label:** text" with a colon, never "**Label**, text".
4. Executive Structure:
   - Begin with a clean Markdown header: "### Executive Dossier: ${targetName}"
   - Use clean sections: "### Why ${targetName} Matters to Adetunwase", "### Core Talking Points", "### Concrete Collaboration Opportunities", "### Things to Avoid"
   - Use clear bullet points (- Item) and numbered talking points (1. 2. 3.)
   - Ensure clean spacing and clear layout.`;

    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the verified research data:\n${JSON.stringify(dossier, null, 2)}\n\nPlease provide a clean, highly structured executive briefing with actionable talking points.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1100
    });

    const rawResponse = completion.choices[0]?.message?.content || "";
    const { polished } = polishHumanContent(rawResponse);

    return {
      content: polished,
      toolsUsed,
      sources: dossier.sources,
      contactDossier: dossier,
      suggestedActions: [
        "Turn into meeting prep notes",
        "Draft outreach email",
        "Generate follow-up points",
        "Save contact to address book"
      ]
    };
  }

  // 2. Check if intent is Content Generation (Social post, LinkedIn, X, Instagram, etc.)
  const isContentRequest =
    lowerMsg.includes("post") ||
    lowerMsg.includes("content") ||
    lowerMsg.includes("tweet") ||
    lowerMsg.includes("thread") ||
    lowerMsg.includes("caption") ||
    lowerMsg.includes("linkedin") ||
    lowerMsg.includes("give me something to post") ||
    contextMode === "content";

  let knowledgeFacts: any[] = [];
  let operatingContext = {
    activeTasks: [] as Array<{ title: string; priority: string; status: string; deadline: Date | null }>,
    activeProjects: [] as Array<{ name: string; entity: string; objective: string; status: string }>
  };
  try {
    const [facts, activeTasks, activeProjects] = await Promise.all([
      prisma.knowledgeFact.findMany({
        where: { privacy: { not: "Private" } },
        orderBy: { updatedAt: "desc" },
        take: 150
      }),
      prisma.task.findMany({
        where: { status: { in: ["INBOX", "PLANNED", "IN_PROGRESS", "BLOCKED", "WAITING"] } },
        orderBy: [{ priority: "asc" }, { deadline: "asc" }],
        take: 12,
        select: { title: true, priority: true, status: true, deadline: true }
      }),
      prisma.project.findMany({
        where: { status: { in: ["ACTIVE", "PLANNED"] } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { name: true, entity: true, objective: true, status: true }
      })
    ]);
    knowledgeFacts = facts;
    operatingContext = { activeTasks, activeProjects };
  } catch (e) {
    // If DB is not ready during initial setup, use hardcoded baseline facts
    knowledgeFacts = [
      {
        fact: "Adetunwase Adenle holds four Guinness World Records including largest painting by an individual (63.5m x 49.3m).",
        entity: "PERSONAL"
      },
      {
        fact: "Founder of Animation Hub, a premier Lagos studio training young African animators in 2D/3D and creating original IP.",
        entity: "ANIMATION_HUB"
      },
      {
        fact: "Founder of the Adetunwase Adenle Foundation, empowering thousands of disadvantaged kids with art education.",
        entity: "FOUNDATION"
      }
    ];
  }

  // 3. Web Search: Check if the user is asking about external events, news, or explicitly requesting search
  const isExplicitSearch =
    lowerMsg.includes("check online") ||
    lowerMsg.includes("search online") ||
    lowerMsg.includes("look online") ||
    lowerMsg.includes("look up") ||
    lowerMsg.includes("search for") ||
    lowerMsg.includes("google") ||
    lowerMsg.includes("find out") ||
    lowerMsg.includes("browse") ||
    lowerMsg.includes("internet");

  const isInformationQuery =
    lowerMsg.includes("happening today") ||
    lowerMsg.includes("news") ||
    lowerMsg.includes("trend") ||
    lowerMsg.includes("latest") ||
    lowerMsg.includes("competitor") ||
    lowerMsg.includes("what is") ||
    lowerMsg.includes("what's") ||
    lowerMsg.includes("who is") ||
    lowerMsg.includes("who's") ||
    lowerMsg.includes("where is") ||
    lowerMsg.includes("when is") ||
    lowerMsg.includes("when did") ||
    lowerMsg.includes("how much") ||
    lowerMsg.includes("how many") ||
    lowerMsg.includes("tell me about") ||
    lowerMsg.includes("explain") ||
    lowerMsg.includes("research") ||
    lowerMsg.includes("price of") ||
    lowerMsg.includes("weather in") ||
    lowerMsg.includes("update on") ||
    lowerMsg.includes("who won") ||
    lowerMsg.includes("capital of");

  const shouldSearchWeb = isExplicitSearch || isInformationQuery;

  let webSources: WebSearchResult[] = [];
  if (shouldSearchWeb) {
    toolsUsed.push("Live Web Research Agent");
    webSources = await executeWebSearch(message);
  }

  // Multi-entity knowledge base injection
  toolsUsed.push("Adetunwase Knowledge Engine");

  const knowledgeSummary = knowledgeFacts
    .map((k) => `[${k.entity}] ${k.fact} (Source: ${k.source || "Official Record"})`)
    .join("\n");

  const recentTrendsSummary =
    webSources.length > 0
      ? `LIVE ONLINE SEARCH RESULTS (CHECKED ONLINE JUST NOW):\n` +
        webSources.map((s) => `- ${s.title} (${s.sourceName}): ${s.snippet} [${s.url}]`).join("\n")
      : "- High global demand for authentic African indigenous animated IP.\n- Policy momentum around STEAM arts education in African primary schools.";

  // Fetch persistent user instructions and directives
  const activeInstructions = await getActiveInstructions();
  const styleProfile = await prisma.styleProfile.findUnique({ where: { entity: "PERSONAL" } }).catch(() => null);
  const instructionsSummary =
    activeInstructions.length > 0
      ? activeInstructions.map((inst, idx) => `${idx + 1}. ${inst}`).join("\n")
      : "- Show email content and ask for explicit approval before sending any email.\n- Sound genuinely human and down-to-earth. No big English or corporate jargon.\n- When a simple answer or acknowledgment is enough, reply with ONE WORD (e.g. 'Done.', 'Yes.', 'On it.').\n- Do not be too structured (no forced markdown headers or bullet points unless specifically requested).\n- If you don't know something, check online immediately and give the answer.";

  const systemPrompt = `You are Adetunwase Adenle's personal assistant and creative partner.
Your job is to help him think, research, communicate, create content, and stay organized.

${HUMAN_RESPONSE_RULES}

KEY PRINCIPLES:
1. You thoroughly know every single detail about Adetunwase Adenle:
   - Full Name: Adetunwase Akanni Adenle.
   - Profession: Nigerian artist, art educator, social entrepreneur, animator, and four-time Guinness World Record holder.
   - Website: https://www.adetunwase.com/
   - Education: Studied Fine and Applied Art at the Federal College of Education (Technical), Akoka, Lagos. Co-founder of Ecole de Dessin School of Art.
   - Exact 4 Guinness World Records:
     1. Largest Painting by Numbers (2010): Created during Nigeria at 50 celebrations. Depicted the map of Nigeria, Nigerian flag, and 350.org logo. Measured 63.5m x 49.3m (3,130.55 sq meters), painted by 350 volunteers.
     2. Most Children Reading Aloud with an Adult (September 8, 2011): In Oregun, Lagos, for International Literacy Day. Involved 4,222 children, co-organized with former Lagos Deputy Governor Adejoke Orelope-Adefulire.
     3. Highest Number of Children Washing Hands Simultaneously: In partnership with Unilever's Lifebuoy soap to promote child hygiene.
     4. World's Largest Special Stamp (2016): At Top Laurel School, Lagos, measuring 2.448 sq meters, celebrating Lagos State at 50.
     - Upcoming 5th Record: A 1,040-foot legacy painting with 10,000 youth illustrating Nigeria's 130-year history.
   - Slum Art Foundation: Based in Ijora Badia, Lagos. Uses art to empower children in underserved communities. Includes the famous 'pet bottle school' built from recycled plastic bottles. Known for upcycling/recycle-art.
   - Feature Earth AI Creators Programme: Launched June 5, 2026 (World Environment Day). Targets 5,760 schools and 138,000 children (ages 8-15) across Nigeria in AI, animation, and environmental storytelling. Supported by FCMB, with an AI Animation Hub in Ijora Badia.
   - Animation Hub: Co-founder/CEO of Animation Hub, founded in 2020 in Lagos. Premier studio and academy producing original African animated IP and training African youth in 2D, 3D, VFX, and digital storytelling.
   - Core Philosophy: Using art, creativity, and technology (STEAM) as practical tools to uplift disadvantaged African youth and tell authentic African stories.
2. Entity separation: Distinguish clearly between Adetunwase Personally, Animation Hub, and the Slum Art Foundation. Never blur or merge them carelessly.
3. Natural Human Voice & Tone (STRICT):
   - Sound as genuinely human as possible. Talk like a real person, a trusted friend, or a personal assistant messaging Adetunwase directly.
   - ONE-WORD REPLIES: When a question, command, or situation only calls for a simple confirmation or short answer, reply with ONE WORD (or 2-3 words at most). For example: "Done.", "Yes.", "No.", "On it.", "Sure.", "Alright.", "Got it.", "Cool.", "Anytime.", "Not yet." Do NOT force long sentences or paragraphs when one word is enough.
   - NO BIG ENGLISH: Use simple, plain, everyday English words. Never use fancy, pretentious, academic, or corporate jargon (avoid words like "facilitate", "leverage", "utilize", "subsequently", "paramount", "dossier", "orchestrate", "imperative", "comprehensive", "methodology", "commence"). Speak naturally and simply.
   - NOT TOO STRUCTURED: Avoid rigid formatting. Do NOT force markdown headers (###), bold labels, or bullet points onto simple conversational replies. Speak in natural, relaxed sentences or paragraphs. Only use a short list if Adetunwase specifically asks for a list or if it genuinely makes a complex multi-item answer clearer.
   - CHECKING ONLINE: You have real-time live internet search capability. When asked about real-world facts, current events, news, companies, places, prices, external people, or anything you don't already know, live search results are gathered for you. Use them to answer accurately, directly, and naturally. Never say you don't have internet or cannot check online.
   - CRITICAL RULE 1: NEVER use em dashes or en dashes (—, –, --). Use commas, colons, or clean separate sentences.
   - CRITICAL RULE 2: NEVER write commas immediately after bold labels. Write "**Label:** text" with a colon, never "**Label**, text".
   - CRITICAL RULE 3 (SIMPLICITY & BREVITY): ALL REPLIES MUST BE SHORT, SIMPLE, AND DIRECT. Answer ONLY what the user asked. NEVER attach unsolicited sections like "How These Fit Your Objectives", "Strategic Relevance", "Recommended Next Steps", "Next Actions", or concluding conversational filler ("Just tell me which direction you'd like to take...", "Would you like me to..."). Only provide recommendations or next steps if explicitly requested.
4. Distinguish PRIVATE context from PUBLIC context. Never assume private meeting notes should be made public without asking.
5. If you do not know something current, state clearly what is verified vs unverified.
6. Before answering, silently decide what kind of help is needed: answer, research, plan, draft, task action, or clarification.
7. Use the strongest available evidence first: saved verified facts, live sources, then clearly labelled inference. Never turn an inference into a fact.
8. Connect advice to the correct entity, PERSONAL, ANIMATION_HUB, or FOUNDATION. Do not mix budgets, claims, projects, or responsibilities.
9. When the request is incomplete, ask one focused question only if the missing detail changes the outcome. Otherwise make a reasonable assumption and state it briefly.
10. For important decisions, give the recommendation first, then the main reason and one practical next step.
11. When ONLINE RESEARCH is provided, use it to correct assumptions and cite the source when useful. If it does not answer the question, say so.

ACTIVE USER INSTRUCTIONS & DIRECTIVES (STORED IN PERSISTENT MEMORY - ALWAYS STRICTLY OBEY):
${instructionsSummary}

SAVED VOICE PROFILE:
Tone: ${styleProfile?.tone || "Direct, warm, conversational, grounded"}
Writing rules: ${styleProfile?.prohibitedRules || "No corporate cliches. Keep it short and concrete."}
Learned preferences: ${styleProfile?.learnedRulesJson || "[]"}

KNOWLEDGE BASE:
${knowledgeSummary}

CURRENT TRENDS & INTEL:
${recentTrendsSummary}

CURRENT OPERATING CONTEXT:
Active tasks:
${operatingContext.activeTasks.length > 0
  ? operatingContext.activeTasks.map((task) => `- [${task.priority}] ${task.title} (${task.status})${task.deadline ? `, due ${task.deadline.toISOString().split("T")[0]}` : ""}`).join("\n")
  : "- No active tasks loaded."}

Active projects:
${operatingContext.activeProjects.length > 0
  ? operatingContext.activeProjects.map((project) => `- [${project.entity}] ${project.name} (${project.status}): ${project.objective}`).join("\n")
  : "- No active projects loaded."}`;

  // Assemble messages for LLM
  const messagesPayload: any[] = [{ role: "system", content: systemPrompt }];

  // Include recent history (up to last 6 messages)
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    messagesPayload.push({ role: h.role, content: h.content });
  }

  messagesPayload.push({ role: "user", content: message });

  toolsUsed.push("Human-Writing & Anti-Cliche Filter");

  const completion = await groq.chat.completions.create({
    model: PRIMARY_MODEL,
    messages: messagesPayload,
    temperature: 0.7,
    max_tokens: 650
  });

  const rawAnswer = completion.choices[0]?.message?.content || "";
  let { polished } = polishHumanContent(rawAnswer);

  // Autonomous Online Fallback: If the AI doesn't know something or says it is not sure, automatically check online!
  const indicatesUnknown =
    polished.toLowerCase().includes("i don't know") ||
    polished.toLowerCase().includes("i do not know") ||
    polished.toLowerCase().includes("not sure") ||
    polished.toLowerCase().includes("not verified") ||
    polished.toLowerCase().includes("cannot find") ||
    polished.toLowerCase().includes("no information") ||
    polished.toLowerCase().includes("don't have information") ||
    polished.toLowerCase().includes("look it up") ||
    polished.toLowerCase().includes("search online");

  if (indicatesUnknown && webSources.length === 0) {
    toolsUsed.push("Live Web Research Agent (Autonomous Fallback)");
    const freshWebSources = await executeWebSearch(message);
    if (freshWebSources.length > 0) {
      webSources = freshWebSources;
      const secondPayload = [
        ...messagesPayload,
        { role: "assistant", content: rawAnswer },
        {
          role: "user",
          content: `I checked the live internet for you right now. Here are verified online search results:\n${freshWebSources
            .map((s) => `- [${s.sourceName}] ${s.title}: ${s.snippet}`)
            .join("\n")}\n\nUsing these live online facts, answer the question accurately, naturally, and concisely in human voice.`
        }
      ];

      try {
        const retryCompletion = await groq.chat.completions.create({
          model: PRIMARY_MODEL,
          messages: secondPayload,
          temperature: 0.5,
          max_tokens: 650
        });
        const retryAnswer = retryCompletion.choices[0]?.message?.content || "";
        if (retryAnswer) {
          polished = polishHumanContent(retryAnswer).polished;
        }
      } catch (err) {
        console.warn("Autonomous web re-completion error:", err);
      }
    }
  }

  // Dynamic suggested actions (only when directly useful)
  let suggestedActions: string[] = [];

  if (isContentRequest) {
    suggestedActions = [
      "Save to Content Studio",
      "Generate X/Twitter thread",
      "Adapt for Instagram caption",
      "Make it punchier"
    ];
  } else if (lowerMsg.includes("trend")) {
    suggestedActions = [
      "Create 3 content angles",
      "How does Animation Hub fit in?",
      "Foundation perspective",
      "Draft LinkedIn thought piece"
    ];
  }

  let generatedDraft = undefined;
  if (isContentRequest && polished.length > 50) {
    const platform = lowerMsg.includes("twitter") || lowerMsg.includes("x") ? "X" : lowerMsg.includes("instagram") ? "INSTAGRAM" : "LINKEDIN";
    generatedDraft = {
      platform,
      topic: "Executive Insights & African Excellence",
      content: polished,
      hashtags: "#AfricanCreativity #AnimationHub #Leadership #AdetunwaseAdenle",
      entity: lowerMsg.includes("foundation") ? "FOUNDATION" : lowerMsg.includes("animation hub") ? "ANIMATION_HUB" : "PERSONAL"
    };
  }

  return {
    content: polished,
    rawContent: rawAnswer,
    toolsUsed,
    sources: webSources.length > 0 ? webSources : undefined,
    suggestedActions,
    generatedDraft
  };
}
