import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL, FAST_MODEL } from "@/lib/groq";
import { polishHumanContent, removeEmDashes, stripAsterisksForPlaintext } from "@/lib/agents/content-cleaner";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const entity = searchParams.get("entity");

    const where: any = {};
    if (platform && platform !== "ALL") where.platform = platform;
    if (status && status !== "ALL") where.status = status;
    if (entity && entity !== "ALL") where.entity = entity;

    const drafts = await prisma.contentDraft.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ drafts });
  } catch (error: any) {
    console.error("Fetch drafts error:", error);
    return NextResponse.json({ error: "Failed to fetch content drafts" }, { status: 500 });
  }
}

function extractJson(text: string): any {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {}
    }
    return { content: text };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, platform, entity, context } = body;

    // Action: Generate new post via AI Pipeline
    if (action === "generate") {
      const targetPlatform = platform || "LINKEDIN";
      const targetEntity = entity || "PERSONAL";

      // Fetch knowledge for this entity
      let facts: any[] = [];
      try {
        facts = await prisma.knowledgeFact.findMany({
          where: { entity: targetEntity },
          take: 6
        });
      } catch (dbErr) {
        console.warn("DB fetch warning in content route:", dbErr);
      }

      const factsContext = facts.map((f) => `- ${f.fact}`).join("\n");

      const prompt = `You are the executive brand content writer for Adetunwase Adenle.
Generate an authentic, high-impact post for ${targetPlatform} on the topic: "${topic || "African creative excellence and storytelling"}".
Entity focus: ${targetEntity} (Personal Brand, Animation Hub, or Foundation).
User Context: ${context || "None provided"}

Entity Knowledge:
${factsContext || "- Adetunwase Adenle is a Guinness World Record artist and founder of Animation Hub."}

PLATFORM INSTRUCTIONS:
- LINKEDIN: Hook, context/story, insight, practical takeaway, natural CTA.
- X: Punchy, memorable take or observation. Maximum 280 characters unless thread requested.
- INSTAGRAM: Engaging storytelling caption, visual idea suggestion, hashtags.
- FACEBOOK: Warm community tone, storytelling, authentic connection.

CRITICAL RULES:
1. STRICTLY NO EM DASHES (—, –, --). Use commas, colons, or clean sentences.
2. ZERO ASTERISKS: Do NOT use markdown bold asterisks (**like this**) or asterisk bullets (* item) in social posts. Social platforms do not support markdown and display asterisks literally. Write clean, natural sentences with line breaks.
3. NO corporate cliches ("delve into", "testament to", "in today's rapidly evolving landscape", etc.).
4. Sound like a grounded African visionary, not a corporate marketer.
5. Keep the rhythm conversational and clear.

Return JSON in this format:
{
  "hook": "Opening sentence",
  "content": "Full post body",
  "visualSuggestion": "Photo or video recommendation",
  "cta": "Closing conversation question",
  "hashtags": "#Hashtag1 #Hashtag2 #Hashtag3"
}`;

      let rawContent = "";
      try {
        const completion = await groq.chat.completions.create({
          model: PRIMARY_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.7
        });
        rawContent = completion.choices[0]?.message?.content || "";
      } catch (primaryErr: any) {
        console.warn("Primary model error, attempting fast model fallback:", primaryErr?.message);
        try {
          const fallbackCompletion = await groq.chat.completions.create({
            model: FAST_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          });
          rawContent = fallbackCompletion.choices[0]?.message?.content || "";
        } catch (fallbackErr: any) {
          console.warn("LLM fallback triggered template generation:", fallbackErr?.message);
          rawContent = JSON.stringify({
            hook: `When we talk about ${topic || "African creative excellence"}, most people only see the finished piece.`,
            content: `When we talk about ${topic || "African creative excellence"}, most people only see the finished piece.\n\nBehind every world record and every animated frame is a relentless commitment to discipline and local talent.\n\nAt ${targetEntity === "ANIMATION_HUB" ? "Animation Hub" : targetEntity === "FOUNDATION" ? "the Foundation" : "our studio"}, we are building sustainable creative pipelines right here in Lagos.\n\nWhat are your thoughts on this?`,
            visualSuggestion: "Behind the scenes photo of the team at work",
            cta: "What are your thoughts on this?",
            hashtags: "#AfricanCreativity #AnimationHub #AdetunwaseAdenle"
          });
        }
      }

      const parsed = extractJson(rawContent);
      const postText = stripAsterisksForPlaintext(parsed.content || rawContent);
      const cleaned = polishHumanContent(postText);

      const created = await prisma.contentDraft.create({
        data: {
          platform: targetPlatform,
          entity: targetEntity,
          topic: topic || "African Creative Excellence",
          hook: parsed.hook || "",
          content: cleaned.polished,
          visualSuggestion: parsed.visualSuggestion || "Behind-the-scenes studio photo or workshop moment",
          cta: parsed.cta || "What are your thoughts on this?",
          hashtags: parsed.hashtags || "#CreativeAfrica #AnimationHub #AdetunwaseAdenle",
          status: "Draft"
        }
      });

      return NextResponse.json({ draft: created, violationsRemoved: cleaned.violationsRemoved });
    }

    // Action: Save manually supplied draft
    const { title, content, hashtags, visualSuggestion, cta } = body;
    const cleaned = polishHumanContent(content || "");

    const newDraft = await prisma.contentDraft.create({
      data: {
        platform: platform || "LINKEDIN",
        entity: entity || "PERSONAL",
        topic: title || topic || "New Thought",
        content: cleaned.polished,
        hashtags: hashtags || "",
        visualSuggestion: visualSuggestion || "",
        cta: cta || "",
        status: "Draft"
      }
    });

    return NextResponse.json({ draft: newDraft });
  } catch (error: any) {
    console.error("Content creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate or save content",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action, customPrompt } = await req.json();

    const existing = await prisma.contentDraft.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    let modifiedContent = existing.content;

    if (action === "remove-em-dashes") {
      modifiedContent = removeEmDashes(existing.content);
    } else if (action === "make-human" || action === "shorten" || action === "personalize") {
      const polishPrompt = `Refine this post for Adetunwase Adenle.
Original Content:
"${existing.content}"

Transformation:
${action === "shorten" ? "Make it significantly more concise and punchy without losing soul." : action === "personalize" ? "Add personal storytelling vulnerability and first-hand perspective as a Guinness World Record artist and educator." : "Make it sound 100% human, eliminating any remaining robotic phrasing or AI tone."}

STRICT RULE: Absolutely NO em dashes (—). Use commas or periods. Avoid cliches.
Return ONLY the revised post text.`;

      const completion = await groq.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [{ role: "user", content: polishPrompt }],
        temperature: 0.6
      });

      const raw = completion.choices[0]?.message?.content || "";
      modifiedContent = polishHumanContent(raw).polished;
    }

    const updated = await prisma.contentDraft.update({
      where: { id },
      data: {
        content: modifiedContent,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ draft: updated });
  } catch (error: any) {
    console.error("Draft polish error:", error);
    return NextResponse.json({ error: "Failed to polish draft" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status, content, rejectionReason } = await req.json();

    const existing = await prisma.contentDraft.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Check if user edited content to record learning delta
    let userEdits = existing.userEdits;
    if (content && content !== existing.content) {
      userEdits = `Original: "${existing.content.slice(0, 100)}..." -> User Edited: "${content.slice(0, 100)}..."`;
    }

    const updated = await prisma.contentDraft.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(content && { content: polishHumanContent(content).polished }),
        ...(rejectionReason && { rejectionReason }),
        ...(userEdits && { userEdits }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ draft: updated });
  } catch (error: any) {
    console.error("Draft update error:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}
