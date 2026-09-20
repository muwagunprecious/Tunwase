/**
 * Human Editor Learning Loop & Adetunwase Writing Profile Engine
 *
 * Captures edits made by the social media manager, analyzes patterns (shortening, corporate jargon removal,
 * emoji removal, adding reflective pauses), and updates Adetunwase's writing rules so future generations
 * continuously improve.
 */

import { prisma } from "@/lib/prisma";
import { groq, PRIMARY_MODEL } from "@/lib/groq";

const LEARNING_MODEL = PRIMARY_MODEL;

export interface EditorFeedbackItem {
  captionBankId: string;
  originalAiCaption: string;
  editedCaption: string;
  finalCaption?: string;
}

/**
 * Ensures Adetunwase's primary Writing Profile exists in the database.
 */
export async function ensureWritingProfile() {
  const existing = await prisma.adetunwaseWritingProfile.findUnique({
    where: { entity: "PERSONAL" }
  });

  if (!existing) {
    return prisma.adetunwaseWritingProfile.create({
      data: {
        entity: "PERSONAL",
        preferredOpenings: [
          "Specific observation from the field or studio",
          "Thoughtful, honest question about opportunity or youth",
          "A quiet moment before a big milestone"
        ],
        preferredEndings: [
          "A reflective question inviting authentic dialogue",
          "A simple statement of gratitude and forward momentum",
          "A reminder of the long-term vision for African youth"
        ],
        favoredWords: ["children", "community", "hands-on", "real people", "give a chance", "believe in them", "craft", "dreams", "future", "work together"],
        avoidedWords: [
          "facilitate", "leverage", "utilize", "synergy", "paradigm", "game-changer", "empowerment theater",
          "pivotal", "proof of concept", "collective power", "measurable", "indispensable", "imperative",
          "manifestation", "paramount", "catalyst", "culmination", "testament", "orchestrate", "dignity",
          "reverence", "oblivious", "luminous", "unprecedented", "trajectory", "methodical", "paradigms",
          "reverberate", "elated", "arduous", "transformative", "transcend", "beacon"
        ],
        paragraphRhythm: "Populated paragraphs of 3 to 5 clear, substantive, everyday conversational sentences. Avoid single-sentence orphan lines or thin fragments. Prioritizes people, conversations, and real human meaning over scenery.",
        sentenceRhythm: "Plain, simple, conversational, grounded everyday English. Mix short and medium sentences with clear transitions ('What stood out to me was...', 'I kept thinking about...', 'That moment reminded me...'). Never poetic, theatrical, academic, or high-sounding.",
        emotionalTone: "Human, thoughtful, warm, grounded, caring, optimistic, emotionally intelligent, purposeful. Emotion comes from the real human situation and meaning, never from poetic metaphors or big grammar.",
        youthTalkStyle: "Speaks of youth as ambitious creators with real agency and dreams, not victims or charity props",
        africaTalkStyle: "Speaks of African storytelling, leadership, and innovation with deep cultural pride and practical excellence",
        educationTalkStyle: "Hands-on creative literacy, practical skills, and STEAM education over rote memorization",
        leadershipTalkStyle: "Leading by listening, showing up, creating opportunities, and rolling up sleeves",
        socialImpactTalkStyle: "Grounded impact in Ijora Badia and beyond, celebrating human dignity and creating genuine opportunity over PR",
        learnedRulesJson: JSON.stringify([
          "PLAIN AND SIMPLE ENGLISH (NO BIG GRAMMAR): Strictly NO high-sounding, academic, or bombastic words ('proof of concept', 'collective power', 'measurable', 'catalyst', 'testament', 'orchestrate', 'luminous', 'facilitate', 'leverage', 'utilize', 'synergy', 'elated', 'arduous', 'transformative'). Speak in plain everyday English that anyone understands ('help', 'use', 'start', 'show', 'work together', 'give a chance', 'believe in them', 'hard', 'proud', 'dreams', 'real people').",
          "POPULATED PARAGRAPHS: Each paragraph must be populated with 3 to 5 clear, conversational, substantive sentences. Do NOT write single-sentence orphan lines or empty fragments.",
          "DO NOT BE POETIC: Never turn ordinary experiences into poetry or use elaborate metaphors ('The sky hugged...', 'The rain whispered...', 'The walls carried the dreams...', 'Her eyes were windows...').",
          "Prioritize PEOPLE and MEANING over scenery. Do not spend paragraphs describing rain, mud, weather, or sounds. One or two concrete details are enough.",
          "Real Personal Posting Voice: Write as Adetunwase posting live from his day on LinkedIn ('This morning at...', 'Yesterday afternoon, I spent time at...', 'Earlier today, while working on...').",
          "The emotion must come from what actually happened, what someone said or did, and why it mattered—never from manufactured poetic language.",
          "Never fabricate tears, trembling voices, private conversations, or fake names.",
          "Never use corporate jargon or marketing fluff."
        ])
      }
    });
  }

  return existing;
}

/**
 * Records an edit made by the social media manager and extracts actionable rules.
 */
export async function recordHumanEdit(item: EditorFeedbackItem) {
  const { captionBankId, originalAiCaption, editedCaption } = item;

  // Calculate simple diff characteristics
  const originalLength = originalAiCaption.length;
  const editedLength = editedCaption.length;
  const isShortened = editedLength < originalLength * 0.85;

  const originalEmojiCount = (originalAiCaption.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const editedEmojiCount = (editedCaption.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const removedEmojis = originalEmojiCount > 0 && editedEmojiCount === 0;

  // Use LLM to analyze the editorial rationale
  const systemPrompt = `You are a style and editorial pattern analyst.
A human social media manager just edited an AI-generated LinkedIn caption for Adetunwase Adenle.

Compare the ORIGINAL AI caption and the EDITED caption.
Identify what changed and formulate 1-2 generalized writing rules for future AI generation.

Look for:
- Did the editor shorten or tighten the text?
- Did the editor remove corporate jargon or pretentious adjectives?
- Did the editor strip emojis or hashtag spam?
- Did the editor make the tone more personal, reflective, or humble?
- Did the editor rewrite the hook to be more direct?

Output JSON format:
{
  "summary": "Brief 1-sentence description of the editor's change",
  "detectedRules": [
    "Concrete rule for future generation (e.g. 'Never use phrases like visionary trailblazer')",
    "Rule 2"
  ]
}`;

  let summary = "Editorial refinements applied.";
  let detectedRules: string[] = [];

  try {
    const completion = await groq.chat.completions.create({
      model: LEARNING_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `ORIGINAL AI CAPTION:\n"""\n${originalAiCaption}\n"""\n\nEDITED HUMAN CAPTION:\n"""\n${editedCaption}\n"""`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    summary = parsed.summary || summary;
    detectedRules = parsed.detectedRules || [];
  } catch (err) {
    console.warn("Edit analysis LLM failed:", err);
    if (isShortened) detectedRules.push("Keep future captions more concise.");
    if (removedEmojis) detectedRules.push("Do not use emojis in captions.");
  }

  // 1. Save ContentEdit record
  const editRecord = await prisma.contentEdit.create({
    data: {
      captionBankId,
      originalAiCaption,
      editedCaption,
      finalCaption: item.finalCaption || editedCaption,
      editorChanges: summary,
      detectedRulesJson: JSON.stringify(detectedRules)
    }
  });

  // 2. Update AdetunwaseWritingProfile learned rules
  const profile = await ensureWritingProfile();
  const currentRules: string[] = JSON.parse(profile.learnedRulesJson || "[]");

  const updatedRules = Array.from(new Set([...currentRules, ...detectedRules])).slice(-25); // retain latest 25 rules

  await prisma.adetunwaseWritingProfile.update({
    where: { id: profile.id },
    data: {
      learnedRulesJson: JSON.stringify(updatedRules)
    }
  });

  // 3. Update the CaptionBankItem itself with edited text
  await prisma.captionBankItem.update({
    where: { id: captionBankId },
    data: {
      caption: editedCaption,
      status: "approved"
    }
  });

  return editRecord;
}

/**
 * Returns prioritized writing rules to be injected into the prompt.
 * PRIORITY HIERARCHY:
 * 1. Adetunwase's published writings & brand beliefs
 * 2. Human editor changes and learned rules
 * 3. Verified brand facts
 * 4. General storytelling principles
 * 5. Reference writer structural style (never identity or words)
 */
export async function getPrioritizedWritingDirectives(): Promise<string> {
  const profile = await ensureWritingProfile();
  const learnedRules: string[] = JSON.parse(profile.learnedRulesJson || "[]");

  return `
ADETUNWASE WRITING PRIORITY HIERARCHY:
1. ADETUNWASE'S GENUINE VOICE (HIGHEST PRIORITY):
   - Tone: ${profile.emotionalTone}
   - Cadence: ${profile.sentenceRhythm}
   - Paragraphing: ${profile.paragraphRhythm}
   - Favored concepts: ${profile.favoredWords.join(", ")}
   - Strictly banned jargon: ${profile.avoidedWords.join(", ")}
   - Youth narrative: ${profile.youthTalkStyle}
   - African excellence: ${profile.africaTalkStyle}

2. HUMAN EDITOR DIRECTIVES (LEARNED FROM REAL SOCIAL MEDIA MANAGER EDITS):
${learnedRules.map((r, i) => `   - ${r}`).join("\n")}

3. STORYTELLING PRINCIPLES:
   - Real Personal Posting Voice: Write as Adetunwase himself posting directly on LinkedIn. Open with an immediate, real-life anchor ('This morning at the Pet Bottle School in Ijora Badia...', 'Yesterday afternoon, I was speaking with a young artist...', 'Earlier today, while working on...').
   - HUMAN, EMOTIONAL, NOT POETIC: Never turn experiences into poetry or elaborate metaphors ('The sky hugged...', 'The rain whispered...', 'Her eyes were windows...'). Describe what actually happened and explain why it mattered.
   - Prioritize PEOPLE and MEANING over scenery: Do not spend paragraphs describing weather, rain, mud, or smells. One concrete detail is enough.
   - Genuine Emotion: Let the emotional power come from the human meaning—what someone said or did, why that moment mattered, what it made Adetunwase realize, and what he believes can happen next.
   - Dignity & Agency: Never portray people as helpless victims or romanticize poverty. Show their talent, ambition, and personality.

4. PLAIN AND SIMPLE ENGLISH (NO BIG GRAMMAR):
   - Strictly NO 'big grammar', academic vocabulary, or heavy dictionary words ('proof of concept', 'collective power', 'measurable', 'indispensable', 'imperative', 'manifestation', 'paramount', 'catalyst', 'culmination', 'testament', 'orchestrate', 'luminous', 'unprecedented', 'trajectory', 'facilitate', 'leverage', 'utilize', 'synergy', 'elated', 'arduous', 'transformative').
   - Use plain everyday conversational English: 'help', 'use', 'start', 'show', 'work together', 'give a chance', 'believe in them', 'hard', 'proud', 'dreams', 'real people'.

5. POPULATED PARAGRAPHS:
   - Each paragraph must be populated with 3 to 5 clear, substantive, everyday sentences.
   - Do NOT write one-sentence line fragments or empty paragraphs.
`;
}
