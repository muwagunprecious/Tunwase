/**
 * Core Types for LinkedIn Social Media Intelligence & Content Management System
 */

export type ContentPillar =
  | "Leadership"
  | "Youth empowerment"
  | "Education"
  | "Social impact"
  | "SlumArt Foundation"
  | "Community development"
  | "Technology"
  | "Entrepreneurship"
  | "Personal experiences"
  | "Personal lessons"
  | "Failure"
  | "Success"
  | "Purpose"
  | "Opportunity"
  | "African development"
  | "Innovation"
  | "Creativity"
  | "Gratitude"
  | "Vision"
  | "Behind the scenes";

export const ALL_CONTENT_PILLARS: ContentPillar[] = [
  "Leadership",
  "Youth empowerment",
  "Education",
  "Social impact",
  "SlumArt Foundation",
  "Community development",
  "Technology",
  "Entrepreneurship",
  "Personal experiences",
  "Personal lessons",
  "Failure",
  "Success",
  "Purpose",
  "Opportunity",
  "African development",
  "Innovation",
  "Creativity",
  "Gratitude",
  "Vision",
  "Behind the scenes"
];

export type CaptionType =
  | "Personal story"
  | "Thought leadership"
  | "Foundation story"
  | "Community story"
  | "Leadership reflection"
  | "Event reflection"
  | "Event recap"
  | "Education"
  | "Youth development"
  | "Technology"
  | "Entrepreneurship"
  | "Failure lesson"
  | "Success lesson"
  | "Purpose"
  | "Vision"
  | "Gratitude"
  | "Partnership"
  | "Achievement"
  | "Behind the scenes"
  | "Social-impact commentary";

export const ALL_CAPTION_TYPES: CaptionType[] = [
  "Personal story",
  "Thought leadership",
  "Foundation story",
  "Community story",
  "Leadership reflection",
  "Event reflection",
  "Event recap",
  "Education",
  "Youth development",
  "Technology",
  "Entrepreneurship",
  "Failure lesson",
  "Success lesson",
  "Purpose",
  "Vision",
  "Gratitude",
  "Partnership",
  "Achievement",
  "Behind the scenes",
  "Social-impact commentary"
];

export type CaptionStatus =
  | "idea"
  | "draft"
  | "ready_for_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "archived";

export interface GeneralizedStyle {
  tone: string[];
  hook_patterns: string[];
  storytelling: {
    uses_real_people: boolean;
    uses_specific_moments: boolean;
    moves_from_story_to_larger_lesson: boolean;
    uses_reflection: boolean;
  };
  paragraph_style: "short" | "medium" | "mixed";
  sentence_style: "clear_and_direct" | "complex" | "poetic";
  emotional_intensity: "low" | "medium" | "medium_high" | "high";
  closing_style: "reflective" | "call_to_action" | "question" | "inspirational";
  pacing?: string;
  emotional_progression?: string;
  cta_style?: string;
  whitespace_style?: string;
  vocabulary_complexity?: string;
  level_of_formality?: string;
}

export interface GeneratedCaptionOutput {
  title: string;
  caption: string;
  hashtags: string[];
  contentPillar: ContentPillar;
  contentType: CaptionType;
  topic: string;
  targetAudience?: string;
  factCheckStatus: "VERIFIED" | "FLAGGED";
  repetitionCheckScore: number;
  brandConsistencyScore: number;
}
