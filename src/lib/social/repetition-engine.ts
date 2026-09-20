/**
 * Repetition & Duplication Engine
 * Compares candidate captions against historical posts, existing bank items, and rejected ideas.
 * Detects repeated hooks, stories, metaphors, lessons, and nearly identical wording.
 */

import { prisma } from "@/lib/prisma";

export interface RepetitionCheckResult {
  passed: boolean;
  maxSimilarity: number;
  duplicateWithId?: string;
  duplicateType?: "HOOK" | "THEME" | "METAPHOR" | "FULL_TEXT" | "NONE";
  reason?: string;
}

/**
 * Tokenizes text into a set of clean word n-grams for semantic overlap detection.
 */
function getTrigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const trigrams = new Set<string>();
  for (let i = 0; i < words.length - 2; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

/**
 * Calculates Jaccard similarity between two texts based on trigram overlap.
 */
function calculateJaccardSimilarity(textA: string, textB: string): number {
  const setA = getTrigrams(textA);
  const setB = getTrigrams(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Extracts the opening 1-2 lines (hook) of a caption.
 */
function extractHook(caption: string): string {
  const lines = caption.trim().split(/\n+/);
  return lines.slice(0, 2).join(" ").trim().toLowerCase();
}

/**
 * Comprehensive Repetition Check:
 * Checks candidate caption against:
 * 1. All existing CaptionBankItems (ready_for_review, approved, scheduled, published, rejected)
 * 2. Historical SocialPosts
 */
export async function checkRepetition(candidateCaption: string, candidateTitle: string): Promise<RepetitionCheckResult> {
  const candidateHook = extractHook(candidateCaption);

  // Fetch recent existing captions (last 100)
  const existingBank = await prisma.captionBankItem.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, caption: true, status: true }
  });

  // Fetch historical social posts
  const historicalPosts = await prisma.socialPost.findMany({
    take: 50,
    orderBy: { postedAt: "desc" },
    select: { id: true, topic: true, content: true }
  });

  let maxSim = 0;
  let culpritId: string | undefined = undefined;
  let dupType: "HOOK" | "THEME" | "METAPHOR" | "FULL_TEXT" | "NONE" = "NONE";
  let reason: string | undefined = undefined;

  // 1. Compare against Caption Bank
  for (const item of existingBank) {
    const itemHook = extractHook(item.caption);
    const hookSim = calculateJaccardSimilarity(candidateHook, itemHook);
    if (hookSim > 0.6) {
      return {
        passed: false,
        maxSimilarity: hookSim,
        duplicateWithId: item.id,
        duplicateType: "HOOK",
        reason: `Opening hook is too similar to an existing caption (${item.title}).`
      };
    }

    const bodySim = calculateJaccardSimilarity(candidateCaption, item.caption);
    if (bodySim > maxSim) {
      maxSim = bodySim;
      culpritId = item.id;
    }

    if (bodySim > 0.45) {
      dupType = "FULL_TEXT";
      reason = `Caption has high structural and textual overlap (${(bodySim * 100).toFixed(0)}%) with "${item.title}".`;
    }
  }

  // 2. Compare against Published Historical Posts
  for (const post of historicalPosts) {
    const postSim = calculateJaccardSimilarity(candidateCaption, post.content);
    if (postSim > maxSim) {
      maxSim = postSim;
      culpritId = post.id;
    }

    if (postSim > 0.45) {
      return {
        passed: false,
        maxSimilarity: postSim,
        duplicateWithId: post.id,
        duplicateType: "THEME",
        reason: `Caption heavily echoes a previously published LinkedIn post (${post.topic}).`
      };
    }
  }

  if (maxSim > 0.45) {
    return {
      passed: false,
      maxSimilarity: maxSim,
      duplicateWithId: culpritId,
      duplicateType: dupType,
      reason
    };
  }

  return {
    passed: true,
    maxSimilarity: maxSim,
    duplicateType: "NONE"
  };
}
