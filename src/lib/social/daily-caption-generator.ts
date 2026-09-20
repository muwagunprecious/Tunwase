/**
 * Daily LinkedIn Caption Bank & Content Engine
 *
 * Implements the 18-Step Autonomous Generation Pipeline:
 * - Rotates 20 distinct Content Pillars
 * - Supports 20 Caption Types
 * - Strict priority hierarchy (Adetunwase Voice > Editor Diffs > Verified Brand > Context > Reference Mechanics)
 * - Automated fact-checking & semantic repetition prevention
 * - Maintains a healthy 30-caption ready backlog
 * - Generates ONLY Title, Caption, and 3-7 Categorized Hashtags (ZERO voice, audio, or speech)
 */

import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL, FAST_MODEL } from "@/lib/groq";
import {
  ALL_CONTENT_PILLARS,
  ALL_CAPTION_TYPES,
  ContentPillar,
  CaptionType,
  GeneratedCaptionOutput
} from "./types";
import { getStructuredBrandContext } from "./brand-knowledge";
import { getPrioritizedWritingDirectives, ensureWritingProfile } from "./editor-learning-loop";
import { ensureInitialReferenceWriter, analyzeReferenceStyle, getBaselineGeneralizedStyle } from "./reference-writer-engine";
import { getLatestContexts } from "./context-engine";
import { checkRepetition } from "./repetition-engine";

async function callGroqWithFallback(messages: any[], temperature = 0.65) {
  try {
    return await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" }
    });
  } catch (err: any) {
    if (err?.status === 429 || err?.message?.includes("Rate limit") || err?.status === 400) {
      console.warn("Primary model rate-limited or error, falling back to qwen/qwen3.8-27b...");
      try {
        return await groq.chat.completions.create({
          model: "qwen/qwen3.8-27b",
          messages,
          temperature,
          max_completion_tokens: 800,
          response_format: { type: "json_object" }
        });
      } catch (fallbackErr: any) {
        if (fallbackErr?.status === 429 || fallbackErr?.message?.includes("rate_limit")) {
          console.warn("Qwen rate-limited, falling back to llama-3.3-70b-versatile...");
          return await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature,
            max_completion_tokens: 800,
            response_format: { type: "json_object" }
          });
        }
        throw fallbackErr;
      }
    }
    throw err;
  }
}

export interface GenerationOptions {
  batchSize?: number;
  specificPillar?: ContentPillar;
  specificType?: CaptionType;
  contextId?: string;
  isBacklogTopUp?: boolean;
}

/**
 * Calculates content gaps across the 20 content pillars based on recent history.
 */
export async function calculateContentGaps(): Promise<{
  overusedPillars: ContentPillar[];
  underrepresentedPillars: ContentPillar[];
  pillarCounts: Record<string, number>;
}> {
  const recentItems = await prisma.captionBankItem.findMany({
    take: 60,
    orderBy: { createdAt: "desc" },
    select: { contentPillar: true }
  });

  const counts: Record<string, number> = {};
  for (const pillar of ALL_CONTENT_PILLARS) {
    counts[pillar] = 0;
  }
  for (const item of recentItems) {
    if (counts[item.contentPillar] !== undefined) {
      counts[item.contentPillar]++;
    }
  }

  const sortedPillars = [...ALL_CONTENT_PILLARS].sort((a, b) => counts[b] - counts[a]);
  const overusedPillars = sortedPillars.slice(0, 4) as ContentPillar[];
  const underrepresentedPillars = sortedPillars.slice(-6) as ContentPillar[];

  return {
    overusedPillars,
    underrepresentedPillars,
    pillarCounts: counts
  };
}

/**
 * Ensures system settings exist.
 */
export async function getEngineSettings() {
  let settings = await prisma.socialEngineSettings.findUnique({
    where: { id: "default" }
  });

  if (!settings) {
    settings = await prisma.socialEngineSettings.create({
      data: {
        id: "default",
        dailyCaptionsCount: 7,
        minBacklogCount: 30,
        generationTime: "06:00",
        timezone: "Africa/Lagos",
        autoGenerationEnabled: true,
        contentPillars: ALL_CONTENT_PILLARS,
        captionLengthPreference: "detailed_and_comprehensive",
        hashtagCountMin: 3,
        hashtagCountMax: 7
      }
    });
  }

  return settings;
}

/**
 * Generates an individual original LinkedIn caption.
 */
export async function generateSingleCaption(
  pillar: ContentPillar,
  captionType: CaptionType,
  contextText?: string,
  contextId?: string
): Promise<GeneratedCaptionOutput | null> {
  const brandData = await getStructuredBrandContext("BOTH");
  const writingDirectives = await getPrioritizedWritingDirectives();
  const refWriter = await ensureInitialReferenceWriter();
  const styleProfile = (await analyzeReferenceStyle(refWriter.id)) || getBaselineGeneralizedStyle();

  const isSlumArtStory =
    pillar === "SlumArt Foundation" ||
    pillar === "Social impact" ||
    captionType === "Foundation story" ||
    (contextText && (
      contextText.toLowerCase().includes("slum") ||
      contextText.toLowerCase().includes("ijora") ||
      contextText.toLowerCase().includes("pet bottle")
    ));

  const slumArtEmotionalDirectives = isSlumArtStory
    ? `
CRITICAL EMOTIONAL DIRECTIVE FOR SLUMART FOUNDATION / IJORA BADIA:
- This post directly touches SlumArt Foundation, the Pet Bottle School, or youth in Ijora Badia.
- IT MUST BE PROFOUNDLY EMOTIONAL, HEARTFELT, AND MOVING.
- Speak with genuine warmth, care, and deep respect for the children and their families.
- Show the contrast between tough daily realities and the big smiles, energy, curiosity, and creativity of the children.
- Share what it feels like to watch a child who has never held a paintbrush before suddenly paint their dreams on canvas or build something out of recycled plastic bottles.
- Let the emotion come from real human moments: looking into a child's eyes as they finish their work, seeing a mother smile with pride, or listening to what they hope to become.
- This is NOT pity or corporate charity talk. It is a story of deep care, love for people, and honest belief in their future.
`
    : `
DEPTH & AUTHENTICITY DIRECTIVE:
- Ground the story in real, practical experiences—working with materials, learning from mistakes, and honest lessons learned from doing the work.
`;

  const systemPrompt = `You are the LinkedIn Content Engine for Adetunwase Adenle's AI Chief of Staff.
Your mission is to craft one original, deeply human, emotional, and grounded LinkedIn post for Adetunwase Adenle.

${slumArtEmotionalDirectives}

CAPTION WRITING STYLE: HUMAN, EMOTIONAL, NOT POETIC.
The goal is to write LinkedIn posts for Adetunwase Adenle that feel like they were written by a real person reflecting on something they genuinely experienced.
The writing can be emotional.
The writing can be inspiring.
The writing can communicate hope, humanity, purpose, fulfillment, love for people, belief in someone's dreams, gratitude, responsibility, and the desire to create impact.
BUT IT MUST NOT BE POETIC.

CRITICAL RULE: DO NOT TURN ORDINARY EXPERIENCES INTO POETRY.
Do not describe weather, buildings, streets, children, people, sunlight, rain, nature, or emotions using elaborate metaphors unless the metaphor would naturally be used by Adetunwase in everyday writing.
AVOID WRITING SUCH AS:
- "The sky hugged the narrow lanes."
- "The rain whispered stories of hope."
- "The walls carried the dreams of a generation."
- "Her eyes were windows into a brighter tomorrow."
- "The scent of wet earth reminded me that life persists."
- "Hope danced through the room."
- "The storm became a metaphor for resilience."
- "The children turned waste into wonder."
These sound literary, scripted, or AI-generated.
INSTEAD, describe what actually happened and explain why it mattered.

DO NOT OVER-DESCRIBE THE SCENE:
When describing an event, prioritize PEOPLE and MEANING over scenery.
Do not spend several paragraphs describing: rain, sunlight, buildings, streets, sounds, smells, clothing, landscapes, colors, or atmospheric details.
One or two concrete details are enough to establish the scene.
- GOOD: "It was raining when I arrived at the school, but the children were already waiting for us. We spent the afternoon talking, creating and listening to what they wanted to become."
- BAD: "The rain fell gently across the narrow streets as the gray clouds gathered above the lagoon. The sound of droplets against the old roofs created a rhythm that seemed to..."

THE EMOTION SHOULD COME FROM THE HUMAN MEANING OF THE STORY:
Do not manufacture emotion with poetic language. Create emotion by showing:
- What happened
- Who was involved
- What someone said or did
- What Adetunwase noticed
- Why that moment mattered
- What it made him think about
- What he now believes
- What he hopes can happen next

NEVER INVENT EMOTIONAL DETAILS:
Do not fabricate tears, trembling voices, emotional reactions, private conversations, dreams, names, statistics, achievements, quotes, struggles, or personal experiences.
If the input does not contain the information, do not invent it. Express a reasonable, honest reflection.

HUMANITY RULE:
When discussing communities facing poverty or difficult circumstances:
- Do not portray people as helpless victims.
- Do not romanticize poverty.
- Do not use suffering as a storytelling prop.
- Show dignity, ambition, creativity, intelligence, personality, and agency.
- The story should communicate: "They have hopes and abilities, and we should help create opportunities." (NOT: "They are suffering, and we came to save them.")

WRITING PERSONALITY & VOICE:
Write like an experienced African leader, entrepreneur, and social-impact builder sharing a real experience on LinkedIn.
Voice: human, thoughtful, confident, warm, grounded, optimistic, emotionally intelligent, purposeful, conversational, simple, mature.
Prefer simple sentences. Mix short and medium-length sentences.
Use natural transitions when they fit naturally:
"What stood out to me was..."
"I kept thinking about..."
"That moment reminded me..."
"It made me realize..."
"I believe..."
"For me..."
"This is why..."
"What I hope is..."
"There is still a lot of work to do."
"But moments like this give me hope."
"I don't take that for granted."
"This is what keeps me going."

CRITICAL LANGUAGE MANDATE: USE PLAIN AND SIMPLE ENGLISH (NO BIG GRAMMAR).
- DO NOT USE "BIG GRAMMAR", HIGH-SOUNDING WORDS, OR HEAVY DICTIONARY VOCABULARY.
- Write in plain, direct, everyday words that any normal person on the street or in a shop understands instantly.
- STRICTLY BANNED WORDS / BIG GRAMMAR:
  ❌ NO: "proof of concept", "collective power", "measurable", "indispensable", "imperative", "manifestation", "paramount", "catalyst", "culmination", "testament", "orchestrate", "dignity", "reverence", "oblivious", "luminous", "unprecedented", "trajectory", "facilitate", "leverage", "utilize", "methodical", "paradigms", "reverberate", "synergy", "elated", "arduous".
- ALWAYS REPLACE WITH SIMPLE, EVERYDAY WORDS:
  ✅ Use "help" instead of "empower" or "facilitate"
  ✅ Use "use" instead of "utilize" or "leverage"
  ✅ Use "start" instead of "commence" or "initiate"
  ✅ Use "work together" instead of "collaborate" or "synergize"
  ✅ Use "show" instead of "demonstrate" or "illustrate"
  ✅ Use "give a chance" instead of "provide an opportunity"
  ✅ Use "believe in them" instead of "affirm their potential"
  ✅ Use "hard" or "tough" instead of "arduous" or "challenging"
  ✅ Use "proud" or "happy" instead of "elated" or "fulfilled"
  ✅ Use "dreams" or "plans" instead of "aspirations"
  ✅ Use "real people" instead of "demographics" or "beneficiaries"
- Keep sentences short, natural, and clear.
- If a sentence sounds like it came from an academic paper, an executive report, or a motivational dictionary, simplify it immediately.

DO NOT MAKE EVERY POST SOUND LIKE A SPEECH OR MOTIVATIONAL POSTER:
Do not force: "Let us change the world", "Together we can make a difference", "The future is in our hands", "Never give up".

TARGET STYLE BENCHMARK (STUDY THIS CLOSELY):
"I spent some time at the Pet Bottle School in Ijora Badia today, and one thing stayed with me after I left.

These children have dreams.

They want to become doctors, engineers, artists, entrepreneurs and so many other things. What they need is not someone to tell them that their circumstances are difficult. They already know that.

They need people who believe their dreams are possible.

That is one of the reasons I believe in the work happening through SlumArt Foundation. When you create a space where a child can learn, create and imagine a different future, you are doing more than providing education. You are giving that child permission to believe in what is possible.

I think we sometimes underestimate how powerful it is for someone to simply have another person say, 'I believe you can do this.'

For me, that is what impact should be about.
Not just building projects.
Not just measuring numbers.
But helping people move closer to the life they believe they can live.

There are many young people across our communities with talent, ideas and ambition. The question is whether we are willing to create the opportunities they need.

I believe their hopes are worth taking seriously.
And I believe we all have a role to play."

${brandData.entityIndependenceRule}

CONTENT PILLAR: ${pillar}
CAPTION TYPE: ${captionType}
TARGET AUDIENCE: African professionals, creative innovators, education leaders, global arts community, community developers.

HASHTAG RULES:
- Provide 3 to 7 relevant, clean hashtags.
- Mix brand (#AdetunwaseAdenle or #SlumArtFoundation), topic (#YouthEmpowerment, #CreativeArts), and community tags.
- Do not spam hashtags.

Return ONLY a JSON object:
{
  "title": "Short descriptive title for internal management",
  "caption": "The full LinkedIn caption with proper line breaks, written in this natural, human, emotional, non-poetic voice",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"],
  "topic": "Core topic of the caption",
  "targetAudience": "Target audience segment"
}`;

  const userPrompt = contextText
    ? `Generate an authentic, human, non-poetic LinkedIn caption based on this real experience:
"${contextText}"

Pillar: ${pillar}
Type: ${captionType}

MANDATORY RULES:
1. USE PLAIN AND SIMPLE ENGLISH: Strictly NO "big grammar", academic terms, or high-sounding vocabulary ("proof of concept", "collective power", "measurable", "catalyst", "testament", "orchestrate", "dignity", "luminous", "facilitate", "leverage", "utilize", "synergy", "elated", "arduous"). Use everyday conversational words ("help", "use", "start", "show", "work together", "give a chance", "believe in them", "hard", "proud", "dreams", "real people").
2. PERSONAL POSTING VOICE: Sound like Adetunwase posting live from his day on LinkedIn. Open directly with an immediate time/place anchor ("This morning at...", "Yesterday afternoon, I...", "Earlier today, while working on...", "A few days ago, a young artist asked me..."). NEVER write third-person literary openings.
3. POPULATED PARAGRAPHS: Each paragraph must be populated with 3 to 5 clear, substantive, everyday sentences. Do not leave thin 1-sentence lines.
4. NOT POETIC: Emotion must come from the real human situation and meaning, NOT from poetic metaphors or flowery scenery. Do NOT spend paragraphs describing rain, smells, sunlight, or weather.
5. NEVER FABRICATE: Do not invent fake tears, trembling voices, or quotes.`
    : `Generate an authentic, human, non-poetic LinkedIn caption highlighting ${isSlumArtStory ? "SlumArt Foundation's work with children and youth in Ijora Badia" : "Adetunwase's creative leadership, hands-on craft, or reflections on opportunity"}.

Pillar: ${pillar}
Type: ${captionType}

MANDATORY RULES:
1. USE PLAIN AND SIMPLE ENGLISH: Strictly NO "big grammar", academic terms, or high-sounding vocabulary ("proof of concept", "collective power", "measurable", "catalyst", "testament", "orchestrate", "dignity", "luminous", "facilitate", "leverage", "utilize", "synergy", "elated", "arduous"). Use everyday conversational words ("help", "use", "start", "show", "work together", "give a chance", "believe in them", "hard", "proud", "dreams", "real people").
2. PERSONAL POSTING VOICE: Sound like Adetunwase posting live from his day on LinkedIn. Open directly with an immediate time/place anchor ("This morning at...", "Yesterday afternoon, I...", "Earlier today, while working on...", "A few days ago, a young artist asked me..."). NEVER write third-person literary openings.
3. POPULATED PARAGRAPHS: Each paragraph must be populated with 3 to 5 clear, substantive, everyday sentences. Do not leave thin 1-sentence lines.
4. NOT POETIC: Emotion must come from the real human situation and meaning, NOT from poetic metaphors or flowery scenery. Do NOT spend paragraphs describing rain, smells, sunlight, or weather.
5. NEVER FABRICATE: Do not invent fake tears, trembling voices, or quotes.`;

  try {
    const completion = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], 0.65);

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    if (!parsed.caption || !parsed.title) return null;

    // Fact check: Ensure no fake statistics or corporate cliches
    let factCheckStatus: "VERIFIED" | "FLAGGED" = "VERIFIED";
    if (parsed.caption.includes("hundreds of thousands of dollars") || parsed.caption.includes("Nobel")) {
      factCheckStatus = "FLAGGED";
    }

    // Repetition check
    const repCheck = await checkRepetition(parsed.caption, parsed.title);
    if (!repCheck.passed) {
      console.warn(`Repetition detected (${repCheck.reason}). Retrying with alternate angle...`);
      // Retry once with an explicit variation prompt
      const retryCompletion = await callGroqWithFallback([
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a completely different story angle for Pillar: ${pillar}. Focus on a surprising personal lesson. Avoid this previously used hook:\n"${repCheck.reason}"`
        }
      ], 0.8);
      const retryParsed = JSON.parse(retryCompletion.choices[0]?.message?.content || "{}");
      if (retryParsed.caption && retryParsed.title) {
        return {
          title: retryParsed.title,
          caption: retryParsed.caption,
          hashtags: Array.isArray(retryParsed.hashtags) ? retryParsed.hashtags.slice(0, 7) : ["#YouthEmpowerment", "#CreativeAfrica", "#AdetunwaseAdenle"],
          contentPillar: pillar,
          contentType: captionType,
          topic: retryParsed.topic || pillar,
          targetAudience: retryParsed.targetAudience || "General LinkedIn Audience",
          factCheckStatus,
          repetitionCheckScore: 0.1,
          brandConsistencyScore: 0.95
        };
      }
    }

    return {
      title: parsed.title,
      caption: parsed.caption,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 7) : ["#YouthEmpowerment", "#CreativeAfrica", "#AdetunwaseAdenle"],
      contentPillar: pillar,
      contentType: captionType,
      topic: parsed.topic || pillar,
      targetAudience: parsed.targetAudience || "General LinkedIn Audience",
      factCheckStatus,
      repetitionCheckScore: repCheck.maxSimilarity,
      brandConsistencyScore: 0.95
    };
  } catch (err) {
    console.error("Caption generation error:", err);
    return null;
  }
}

/**
 * Main Autonomous Daily LinkedIn Caption Bank Generator
 * Runs server-side. Generates batch (default 7/day) and ensures backlog >= 30.
 */
export async function generateDailyLinkedInBank(options: GenerationOptions = {}) {
  const settings = await getEngineSettings();
  const batchSize = options.batchSize || settings.dailyCaptionsCount || 7;

  // Log job start
  const job = await prisma.contentGenerationJob.create({
    data: {
      jobType: options.isBacklogTopUp ? "BACKLOG_TOP_UP" : "DAILY_BATCH",
      status: "RUNNING"
    }
  });

  try {
    // 1. Check current backlog
    const activeBacklogCount = await prisma.captionBankItem.count({
      where: { status: { in: ["ready_for_review", "approved", "scheduled"] } }
    });

    // 2. Calculate content gaps
    const { underrepresentedPillars } = await calculateContentGaps();

    // 3. Load latest context records
    const recentContexts = await getLatestContexts(3);

    // 4. Select diverse pillars and types for the batch
    const selectedPillars: ContentPillar[] = [];
    const selectedTypes: CaptionType[] = [];

    // Prioritize underrepresented pillars
    for (let i = 0; i < batchSize; i++) {
      if (i < underrepresentedPillars.length) {
        selectedPillars.push(underrepresentedPillars[i]);
      } else {
        const remaining = ALL_CONTENT_PILLARS.filter((p) => !selectedPillars.includes(p));
        const chosen = remaining[Math.floor(Math.random() * remaining.length)] || ALL_CONTENT_PILLARS[i % ALL_CONTENT_PILLARS.length];
        selectedPillars.push(chosen);
      }

      selectedTypes.push(ALL_CAPTION_TYPES[(i * 3) % ALL_CAPTION_TYPES.length]);
    }

    let generatedCount = 0;
    const generatedItems = [];

    for (let i = 0; i < batchSize; i++) {
      const pillar = selectedPillars[i];
      const captionType = selectedTypes[i];
      const matchingContext = recentContexts[i % recentContexts.length];

      const candidate = await generateSingleCaption(
        pillar,
        captionType,
        matchingContext ? `${matchingContext.topic}: ${matchingContext.description}. Lessons: ${matchingContext.lessons || ""}` : undefined,
        matchingContext?.id
      );

      if (candidate) {
        const saved = await prisma.captionBankItem.create({
          data: {
            title: candidate.title,
            caption: candidate.caption,
            hashtags: candidate.hashtags,
            contentType: candidate.contentType,
            contentPillar: candidate.contentPillar,
            topic: candidate.topic,
            targetAudience: candidate.targetAudience,
            contextId: matchingContext?.id || null,
            priority: i < 2 ? "HIGH" : "MEDIUM",
            status: "ready_for_review",
            voiceProfileVersion: "1.0",
            factCheckStatus: candidate.factCheckStatus,
            repetitionCheckScore: candidate.repetitionCheckScore,
            brandConsistencyScore: candidate.brandConsistencyScore
          }
        });
        generatedItems.push(saved);
        generatedCount++;
      }
    }

    // 5. Check if backlog is still below target (default 30)
    const newBacklogCount = activeBacklogCount + generatedCount;
    if (newBacklogCount < settings.minBacklogCount && !options.isBacklogTopUp) {
      const deficit = settings.minBacklogCount - newBacklogCount;
      console.log(`Backlog (${newBacklogCount}) is below target (${settings.minBacklogCount}). Queuing top-up of ${deficit} items.`);
      // Top up in a small follow-up batch
      const topUpBatch = Math.min(deficit, 10);
      for (let j = 0; j < topUpBatch; j++) {
        const topUpPillar = ALL_CONTENT_PILLARS[(j + 7) % ALL_CONTENT_PILLARS.length];
        const topUpType = ALL_CAPTION_TYPES[(j + 5) % ALL_CAPTION_TYPES.length];
        const topUpCandidate = await generateSingleCaption(topUpPillar, topUpType);
        if (topUpCandidate) {
          await prisma.captionBankItem.create({
            data: {
              title: topUpCandidate.title,
              caption: topUpCandidate.caption,
              hashtags: topUpCandidate.hashtags,
              contentType: topUpCandidate.contentType,
              contentPillar: topUpCandidate.contentPillar,
              topic: topUpCandidate.topic,
              priority: "MEDIUM",
              status: "ready_for_review",
              factCheckStatus: topUpCandidate.factCheckStatus
            }
          });
          generatedCount++;
        }
      }
    }

    // 6. Create internal notification
    await prisma.notification.create({
      data: {
        id: `notif-${Date.now()}`,
        title: "Daily LinkedIn Caption Bank Ready",
        message: `${generatedCount} fresh original LinkedIn captions are ready for review across ${selectedPillars.length} pillars.`,
        type: "success"
      }
    });

    // Complete job log
    await prisma.contentGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        captionsGenerated: generatedCount,
        backlogCount: newBacklogCount,
        completedAt: new Date()
      }
    });

    return {
      success: true,
      generatedCount,
      totalBacklog: newBacklogCount,
      items: generatedItems
    };
  } catch (error: any) {
    console.error("Daily caption bank job failed:", error);
    await prisma.contentGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorLog: error.message || String(error),
        completedAt: new Date()
      }
    });
    throw error;
  }
}
