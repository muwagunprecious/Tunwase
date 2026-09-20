/**
 * Reference Writers & Generalized Storytelling Analysis Engine
 *
 * CRITICAL DIRECTIVE:
 * This engine studies high-level structural storytelling principles from public writers (e.g. Tunde Onakoya).
 * It strictly DOES NOT:
 * - Clone identity, voice, speech, or audio.
 * - Store individual sentences as templates.
 * - Reproduce distinctive phrases.
 * - Imitate a specific person's personality.
 * - Bypass any platform security controls or access barriers.
 *
 * It extracts generalized storytelling mechanics (e.g. personal moment -> universal lesson).
 */

import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL } from "@/lib/groq";
import { GeneralizedStyle } from "./types";

const ANALYSIS_MODEL = PRIMARY_MODEL;

export const INITIAL_REFERENCE_WRITER = {
  name: "Tunde Onakoya",
  linkedinUrl: "https://ng.linkedin.com/in/tunde-onakoya",
  bio: "Founder of Chess in Slums Africa, Guinness World Record holder, social impact advocate and public storyteller.",
  notes:
    "Reference writer for studying high-level storytelling architecture: transition from a personal vignette to an overarching lesson on hope, youth potential, and community resilience."
};

/**
 * Ensures the initial reference writer exists in the database.
 */
export async function ensureInitialReferenceWriter() {
  const existing = await prisma.referenceWriter.findUnique({
    where: { linkedinUrl: INITIAL_REFERENCE_WRITER.linkedinUrl }
  });

  if (!existing) {
    return prisma.referenceWriter.create({
      data: INITIAL_REFERENCE_WRITER
    });
  }

  return existing;
}

/**
 * Safely ingests a public reference post without violating platform rules.
 * Supports manual text entry, exported post data, or public URL references.
 */
export async function addReferencePost(params: {
  writerId: string;
  postText: string;
  postUrl?: string;
  topic?: string;
  publishedAt?: Date;
  sourceType?: "MANUAL_INPUT" | "URL_FETCH" | "DATA_EXPORT";
}) {
  return prisma.referencePost.create({
    data: {
      writerId: params.writerId,
      postText: params.postText.trim(),
      postUrl: params.postUrl?.trim() || null,
      topic: params.topic?.trim() || "Social Impact & Storytelling",
      publishedAt: params.publishedAt || new Date(),
      sourceType: params.sourceType || "MANUAL_INPUT"
    }
  });
}

/**
 * Analyzes collected reference posts for HIGH-LEVEL storytelling characteristics only.
 * Output is an abstract, generalized style profile that contains NO copied sentences or distinctive phrases.
 */
export async function analyzeReferenceStyle(writerId: string, forceRefresh = false): Promise<GeneralizedStyle> {
  if (!forceRefresh) {
    const cached = await prisma.generalizedStyleProfile.findUnique({
      where: { writerId }
    });
    if (cached) {
      return {
        tone: cached.tone,
        hook_patterns: cached.hookPatterns,
        storytelling: JSON.parse(cached.storytellingJson || "{}"),
        paragraph_style: (cached.paragraphStyle as any) || "medium",
        sentence_style: (cached.sentenceStyle as any) || "clear_and_direct",
        emotional_intensity: (cached.emotionalIntensity as any) || "medium_high",
        closing_style: (cached.closingStyle as any) || "reflective",
        pacing: cached.pacing || "measured_reflective",
        emotional_progression: cached.emotionalProgression || "personal_to_universal",
        cta_style: cached.ctaStyle || "open_invitation",
        whitespace_style: (cached.whitespaceStyle as any) || "generous",
        vocabulary_complexity: (cached.vocabularyComplexity as any) || "simple_and_direct",
        level_of_formality: (cached.levelOfFormality as any) || "conversational_authentic"
      };
    }
  }

  const writer = await prisma.referenceWriter.findUnique({
    where: { id: writerId },
    include: { posts: { take: 10, orderBy: { collectedAt: "desc" } } }
  });

  if (!writer || writer.posts.length === 0) {
    // Return baseline generalized social impact style
    return getBaselineGeneralizedStyle();
  }

  const combinedTexts = writer.posts
    .map((p, idx) => `[Post ${idx + 1} - Topic: ${p.topic || "General"}]\n${p.postText}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are an expert literary and structural communication analyst.
Your task is to analyze the structural writing mechanics of public LinkedIn posts.

STRICT ETHICAL & LEGAL RULES:
1. NEVER copy or output verbatim sentences, distinctive catchphrases, or personal anecdotes.
2. NEVER describe how to impersonate or imitate the author's personal identity.
3. Extract ONLY generalized, high-level storytelling architecture, pacing, rhythm, and structural patterns.
4. Output MUST be valid JSON conforming strictly to the requested schema.

Extract the following generalized structural dimensions:
- tone: array of 3-5 emotional adjectives (e.g. ["human", "reflective", "hopeful", "grounded", "community-centered"])
- hook_patterns: array of 3-4 structural opening types (e.g. ["personal_observation", "thought-provoking_question", "unexpected_moment", "contrast_setup"])
- storytelling: object with boolean flags:
    uses_real_people: true/false
    uses_specific_moments: true/false
    moves_from_story_to_larger_lesson: true/false
    uses_reflection: true/false
- paragraph_style: "short" (1-2 sentences) | "medium" | "mixed"
- sentence_style: "clear_and_direct" | "complex" | "poetic"
- emotional_intensity: "low" | "medium" | "medium_high" | "high"
- closing_style: "reflective" | "call_to_action" | "question" | "inspirational"
- pacing: description of cadence and whitespace
- emotional_progression: structural journey (e.g. "specific humble detail -> community moment -> universal moral reflection")
- cta_style: how engagement is invited (e.g. "invitation to reflect", "question to audience", "shared gratitude")
- whitespace_style: "generous", "moderate", or "dense"
- vocabulary_complexity: "simple_and_direct", "moderate", or "academic"
- level_of_formality: "conversational_authentic", "formal", or "casual"

Return ONLY the raw JSON object.`;

  try {
    const completion = await groq.chat.completions.create({
      model: ANALYSIS_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze the high-level structural patterns across these ${writer.posts.length} sample public posts:\n\n${combinedTexts}`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed: GeneralizedStyle = JSON.parse(raw);

    // Persist to GeneralizedStyleProfile table
    await prisma.generalizedStyleProfile.upsert({
      where: { writerId },
      update: {
        writerName: writer.name,
        tone: parsed.tone || ["human", "reflective", "hopeful", "social-impact"],
        hookPatterns: parsed.hook_patterns || ["personal_observation", "unexpected_statement"],
        storytellingJson: JSON.stringify(parsed.storytelling || {}),
        paragraphStyle: parsed.paragraph_style || "short",
        sentenceStyle: parsed.sentence_style || "clear_and_direct",
        pacing: parsed.pacing || "measured_reflective",
        emotionalProgression: parsed.emotional_progression || "personal_to_universal",
        closingStyle: parsed.closing_style || "reflective",
        ctaStyle: parsed.cta_style || "open_invitation",
        vocabularyComplexity: parsed.vocabulary_complexity || "simple_and_direct",
        levelOfFormality: parsed.level_of_formality || "conversational_authentic",
        emotionalIntensity: parsed.emotional_intensity || "medium_high",
        whitespaceStyle: parsed.whitespace_style || "generous",
        storytellingPatterns: parsed.hook_patterns || []
      },
      create: {
        writerId,
        writerName: writer.name,
        tone: parsed.tone || ["human", "reflective", "hopeful", "social-impact"],
        hookPatterns: parsed.hook_patterns || ["personal_observation", "unexpected_statement"],
        storytellingJson: JSON.stringify(parsed.storytelling || {}),
        paragraphStyle: parsed.paragraph_style || "short",
        sentenceStyle: parsed.sentence_style || "clear_and_direct",
        pacing: parsed.pacing || "measured_reflective",
        emotionalProgression: parsed.emotional_progression || "personal_to_universal",
        closingStyle: parsed.closing_style || "reflective",
        ctaStyle: parsed.cta_style || "open_invitation",
        vocabularyComplexity: parsed.vocabulary_complexity || "simple_and_direct",
        levelOfFormality: parsed.level_of_formality || "conversational_authentic",
        emotionalIntensity: parsed.emotional_intensity || "medium_high",
        whitespaceStyle: parsed.whitespace_style || "generous",
        storytellingPatterns: parsed.hook_patterns || []
      }
    });

    return parsed;
  } catch (error) {
    console.warn("Style analysis failed, using baseline generalized style:", error);
    return getBaselineGeneralizedStyle();
  }
}

export function getBaselineGeneralizedStyle(): GeneralizedStyle {
  return {
    tone: ["human", "reflective", "hopeful", "grounded", "social-impact"],
    hook_patterns: [
      "personal_observation",
      "thought-provoking_question",
      "unexpected_statement",
      "specific_moment_anchor"
    ],
    storytelling: {
      uses_real_people: true,
      uses_specific_moments: true,
      moves_from_story_to_larger_lesson: true,
      uses_reflection: true
    },
    paragraph_style: "short",
    sentence_style: "clear_and_direct",
    emotional_intensity: "medium_high",
    closing_style: "reflective",
    pacing: "Measured and deliberate with short paragraphs that let each idea breathe.",
    emotional_progression: "Ground in a specific moment -> reveal emotional resonance -> draw a larger lesson about human potential.",
    cta_style: "Thoughtful question inviting community reflection rather than sales pitch.",
    whitespace_style: "Generous spacing with 1 to 2 sentences per paragraph.",
    vocabulary_complexity: "Simple, everyday words accessible to everyone.",
    level_of_formality: "Conversational, sincere, and authentic."
  };
}
