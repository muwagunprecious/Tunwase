/**
 * Context Engine
 * Converts raw events, meetings, observations, or photos into rich, structured content contexts.
 */

import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL } from "@/lib/groq";

const EXTRACTION_MODEL = PRIMARY_MODEL;

export interface ParsedContextData {
  event?: string;
  location?: string;
  people?: string;
  organizations?: string;
  topic: string;
  description: string;
  lessons?: string;
  verifiedFacts: string[];
  statistics?: string;
  emotionalSignificance?: string;
  potentialContentAngles: string[];
}

/**
 * Parses raw unstructured user input (e.g. "I visited a school in Ijora Badia today and saw 40 kids drawing...")
 * into a structured ContentContext database record.
 */
export async function ingestRawContext(rawInput: string, attachments: string[] = []) {
  const systemPrompt = `You are the Context Intelligence Engine for Adetunwase Adenle's AI Chief of Staff.
The user has provided raw, quick notes about an event, meeting, community visit, personal lesson, or achievement.

Your task is to parse this into a structured context object for LinkedIn content generation.

STRICT ACCURACY RULES:
1. ONLY extract facts explicitly stated or directly implied by the user's note.
2. NEVER invent numbers, names, schools, organizations, or metrics.
3. If no statistics are mentioned, leave statistics empty.
4. Extract 3-4 compelling, authentic content angles that could become original LinkedIn posts.

Output JSON format:
{
  "event": "Short title or event type",
  "location": "City, area, or venue if mentioned",
  "people": "Names or groups of people met",
  "organizations": "Companies, partners, or schools involved",
  "topic": "Main theme (e.g. Youth Empowerment, Education, Resilience)",
  "description": "Clean, synthesized factual description",
  "lessons": "Key takeaway or moral reflection from the experience",
  "verifiedFacts": ["Fact 1", "Fact 2"],
  "statistics": "Specific numbers or metrics if mentioned, else empty string",
  "emotionalSignificance": "Why this moment matters to Adetunwase or the community",
  "potentialContentAngles": [
    "Angle 1: Focus on the children's ingenuity",
    "Angle 2: Focus on community collaboration",
    "Angle 3: Focus on sustainable materials"
  ]
}`;

  let parsed: ParsedContextData;
  try {
    const completion = await groq.chat.completions.create({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Raw user input:\n"${rawInput}"` }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(rawContent);
  } catch (err) {
    console.warn("Context extraction LLM failed, using fallback parsing:", err);
    parsed = {
      topic: "Daily Experience",
      description: rawInput,
      verifiedFacts: [rawInput.slice(0, 120)],
      potentialContentAngles: ["Reflections on today's hands-on work", "Lessons learned in the field"]
    };
  }

  // Create record in database
  const created = await prisma.contentContext.create({
    data: {
      event: parsed.event || "Field Activity",
      location: parsed.location || "Lagos, Nigeria",
      people: parsed.people || null,
      organizations: parsed.organizations || null,
      topic: parsed.topic || "Personal Experience",
      description: parsed.description || rawInput,
      lessons: parsed.lessons || null,
      verifiedFacts: parsed.verifiedFacts || [],
      statistics: parsed.statistics || null,
      emotionalSignificance: parsed.emotionalSignificance || null,
      potentialContentAngles: parsed.potentialContentAngles || [],
      attachments: attachments
    }
  });

  return created;
}

/**
 * Retrieves the latest unexhausted context records for content generation.
 */
export async function getLatestContexts(limit = 5) {
  return prisma.contentContext.findMany({
    take: limit,
    orderBy: { createdAt: "desc" }
  });
}
