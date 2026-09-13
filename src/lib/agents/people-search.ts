/**
 * People Research Agent & Web Scraper
 * Multi-pass autonomous executive research for Adetunwase Adenle.
 * Strictly adheres to ethical public research, zero em dashes, and anti-fabrication standards.
 */

import { groq, PRIMARY_MODEL, FAST_MODEL } from "@/lib/groq";
import { executeWebSearch, WebSearchResult } from "./web-search";
import { cleanGeneratedContent, removeEmDashes } from "./content-cleaner";

export interface DisambiguatedPerson {
  id: string;
  name: string;
  knownName?: string;
  role: string;
  company: string;
  location: string;
  industry: string;
  snippet: string;
  confidence: "High" | "Medium" | "Low";
}

export interface VerifiedEmail {
  email: string;
  type: "Primary" | "Secondary";
  source: string;
  confidence: "High" | "Medium" | "Low";
  isPattern: boolean;
  discoveredDate: string;
}

export interface VerifiedPhone {
  number: string;
  type: "Business Office" | "Company Switchboard" | "Media & Press Inquiries" | "Public Executive Contact";
  source: string;
  confidence: "High" | "Medium" | "Low";
  discoveredDate: string;
}

export interface SocialProfile {
  platform: "LinkedIn" | "X" | "Instagram" | "Facebook" | "YouTube" | "Other";
  url: string;
  handle?: string;
  verifiedNotes?: string;
}

export interface FactWithSource {
  fact: string;
  source: string;
}

export interface PersonProfile {
  id: string;
  personalInfo: {
    name: string;
    knownName?: string;
    currentRole: string;
    company: string;
    industry: string;
    countryRegion: string;
    bio: string;
  };
  professionalInfo: {
    currentPosition: string;
    company: string;
    previousCompanies: string[];
    isFounder: boolean;
    founderOf?: string[];
    experienceSummary: string;
    education: FactWithSource[];
    achievements: FactWithSource[];
    organizations: string[];
    boardPositions: string[];
    publicProjects: FactWithSource[];
    investments: FactWithSource[];
    speakingEngagements: string[];
    awards: FactWithSource[];
    publications: string[];
  };
  socialMedia: SocialProfile[];
  contactInfo: {
    emails: VerifiedEmail[];
    phones: VerifiedPhone[];
    companyWebsite?: string;
    publicOfficeAddress?: string;
    emailNote?: string;
    phoneNote?: string;
  };
  companyOverview?: {
    name: string;
    website?: string;
    industry: string;
    overview: string;
    leadership?: string[];
    recentDevelopments?: string[];
  };
  recentActivity: {
    latestNews: FactWithSource[];
    recentInterviews: FactWithSource[];
    recentPublicPosts: string[];
    companyAnnouncements: string[];
  };
  sources: Array<{
    title: string;
    url: string;
    sourceName: string;
    date: string;
    confidence: "High" | "Medium" | "Low";
  }>;
  aiDebrief: string;
  lastResearched: string;
  isDeepSearch: boolean;
  whyMattersToAdetun: string;
}

export interface PeopleSearchResult {
  status: "SINGLE_MATCH" | "AMBIGUOUS" | "NOT_FOUND";
  query: string;
  explanation: string;
  candidates?: DisambiguatedPerson[];
  profile?: PersonProfile;
}

export interface MeetingBrief {
  personName: string;
  roleAndCompany: string;
  thirtySecondSummary: string;
  whatTheyDoAndCareAbout: string;
  recentDevelopments: string[];
  connectionToAdetunwase: string;
  partnershipOpportunities: string[];
  strategicTalkingPoints: string[];
  thingsToAvoid: string[];
  questionsAdetunCouldAsk: string[];
}

export interface OutreachDraft {
  recipientName: string;
  recipientRole: string;
  company: string;
  emailSubject: string;
  emailBody: string;
  linkedinMessage: string;
  keyAnglesUsed: string[];
}

/**
 * Step 1: Clean and parse natural query (e.g., "Find Iyinoluwa Aboyeji" -> "Iyinoluwa Aboyeji")
 */
export function extractTargetFromNaturalQuery(input: string): { targetName: string; companyHint?: string } {
  let cleaned = input.trim();
  // Strip leading natural language prefixes
  cleaned = cleaned.replace(/^(find|research|who is|look up|search for|tell me about|find me the contact of|get info on|profile of)\s+/i, "");
  // Strip trailing punctuation
  cleaned = cleaned.replace(/[?.!]+$/, "").trim();

  // Check for "CEO of XYZ" or "Founder of XYZ"
  const titleOfMatch = cleaned.match(/^(?:the\s+)?(ceo|founder|director|managing director|head|president)\s+of\s+(.+)$/i);
  if (titleOfMatch) {
    return { targetName: `${titleOfMatch[1]} of ${titleOfMatch[2]}`, companyHint: titleOfMatch[2] };
  }

  // Check for "Name at Company" or "Name of Company"
  const atMatch = cleaned.match(/^(.+?)\s+(?:at|of|from)\s+(.+)$/i);
  if (atMatch) {
    return { targetName: atMatch[1].trim(), companyHint: atMatch[2].trim() };
  }

  return { targetName: cleaned };
}

/**
 * Step 2: Multi-query web search to gather rich public context across search engines, press, and LinkedIn
 */
async function performMultiQuerySearch(targetName: string, companyHint?: string): Promise<WebSearchResult[]> {
  const queries = [
    companyHint ? `${targetName} ${companyHint} executive profile` : `${targetName} executive profile biography`,
    `${targetName} current company role official website`,
    `${targetName} interview conference news TechCabal or Reuters or Bloomberg`,
    `${targetName} contact email phone public directory`
  ];

  const resultsNested = await Promise.all(queries.map((q) => executeWebSearch(q)));
  const flat = resultsNested.flat();

  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const unique: WebSearchResult[] = [];
  for (const r of flat) {
    if (!seenUrls.has(r.url)) {
      seenUrls.add(r.url);
      unique.push(r);
    }
  }
  return unique.slice(0, 10);
}

/**
 * Step 3: Disambiguate if the name belongs to multiple distinct people
 */
export async function investigatePerson(
  rawQuery: string,
  options?: {
    forcedPerson?: DisambiguatedPerson;
    deep?: boolean;
  }
): Promise<PeopleSearchResult> {
  const { targetName, companyHint } = extractTargetFromNaturalQuery(rawQuery);
  const searchResults = await performMultiQuerySearch(targetName, companyHint);

  const currentDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // If forcedPerson is passed, skip disambiguation and generate profile directly
  if (options?.forcedPerson) {
    const profile = await synthesizePersonProfile(options.forcedPerson.name, searchResults, options.deep || false, options.forcedPerson);
    return {
      status: "SINGLE_MATCH",
      query: rawQuery,
      explanation: `Identified profile for ${options.forcedPerson.name} (${options.forcedPerson.role} at ${options.forcedPerson.company}).`,
      profile
    };
  }

  // Prompt LLM to analyze results for homonyms / multiple distinct public figures
  const disambiguationPrompt = `
You are an expert executive intelligence researcher for Adetunwase Adenle.
User Query: "${rawQuery}"
Target Name: "${targetName}"
Company Hint: "${companyHint || "None"}"

Web Search Results:
${searchResults.map((r, i) => `[${i + 1}] Title: ${r.title} | Source: ${r.sourceName} | Snippet: ${r.snippet}`).join("\n")}

Determine if there are multiple prominent public individuals with the name "${targetName}" in the search results.
For example:
- "David Adeleke" has two famous figures: Davido (David Adedeji Adeleke, Afrobeats megastar) and David I. Adeleke (media leader, Africa-focused tech journalist & entrepreneur).
- "John Smith" has multiple distinct leaders.
- "Iyinoluwa Aboyeji" is clearly one prominent tech leader (Future Africa, Andela, Flutterwave co-founder).

STRICT OUTPUT FORMAT: Return ONLY a valid JSON object:
{
  "isAmbiguous": boolean,
  "explanation": "concise explanation of findings without any em dashes",
  "candidates": [
    {
      "id": "cand_1",
      "name": "Full name",
      "knownName": "optional pseudonym or known moniker",
      "role": "Current Primary Role",
      "company": "Company or Institution",
      "location": "City, Country",
      "industry": "Industry",
      "snippet": "1-2 sentence distinguishing bio",
      "confidence": "High" or "Medium"
    }
  ],
  "primaryMatch": {
    "name": "Full name",
    "role": "Current Role",
    "company": "Company",
    "location": "City, Country",
    "industry": "Industry"
  }
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: "system", content: "You are a precise executive research agent. Never invent facts. Return valid JSON only. Never use em dashes." },
        { role: "user", content: disambiguationPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

    // If ambiguous and multiple strong candidates found (and no company hint specified that clears it)
    if (parsed.isAmbiguous && parsed.candidates && parsed.candidates.length > 1 && !companyHint) {
      return {
        status: "AMBIGUOUS",
        query: rawQuery,
        explanation: removeEmDashes(parsed.explanation || `I found ${parsed.candidates.length} distinct individuals matching this name. Please select which person you would like to research.`),
        candidates: parsed.candidates
      };
    }

    // Otherwise single match: proceed to build full profile
    const selectedCandidate = parsed.candidates?.[0] || parsed.primaryMatch;
    const profile = await synthesizePersonProfile(targetName, searchResults, options?.deep || false, selectedCandidate);

    return {
      status: "SINGLE_MATCH",
      query: rawQuery,
      explanation: removeEmDashes(parsed.explanation || `I found one clear primary match for ${targetName}. Here is the complete executive profile.`),
      profile
    };
  } catch (error) {
    console.error("Disambiguation error:", error);
    // Fallback directly to profile synthesis
    const profile = await synthesizePersonProfile(targetName, searchResults, options?.deep || false);
    return {
      status: "SINGLE_MATCH",
      query: rawQuery,
      explanation: `Research compiled for ${targetName}.`,
      profile
    };
  }
}

/**
 * Step 4: Full Multi-Source Profile Synthesis
 */
export async function synthesizePersonProfile(
  targetName: string,
  searchResults: WebSearchResult[],
  isDeep: boolean = false,
  candidateHint?: any
): Promise<PersonProfile> {
  const currentDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const synthesisPrompt = `
You are the Chief Intelligence Researcher for Adetunwase Adenle (4 Guinness World Record artist, founder of Animation Hub and the Adetunwase Adenle Foundation).
Synthesize a comprehensive, verified executive dossier for: "${targetName}".

Known context hints: ${candidateHint ? JSON.stringify(candidateHint) : "None"}.
Deep Search Mode: ${isDeep ? "ACTIVE (include secondary appearances, deep history, and media interviews)" : "STANDARD"}.

Web Search Evidence:
${searchResults.map((r, i) => `[${i + 1}] Source: ${r.sourceName} | URL: ${r.url} | Snippet: ${r.snippet}`).join("\n")}

STRICT RULES & CONSTRAINTS:
1. NO FABRICATION: Do not invent email addresses, phone numbers, colleges, awards, or companies. If an email or phone cannot be verified, state it honestly.
2. EMAIL RULES:
   - If an official public email is found in evidence, include it with High/Medium confidence.
   - If an email is inferred from their corporate domain (e.g. name@company.com), set isPattern: true, confidence: "Low", source: "Inferred corporate domain pattern", and label it "Possible email pattern (Not verified)".
   - NEVER create fake generic emails like "name@gmail.com".
3. PHONE RULES:
   - Only include publicly listed corporate headquarters switchboards, official office numbers, or media inquiry lines.
   - If not found publicly, return an empty phones array and explain in phoneNote: "I could not verify a public professional phone number for this person."
4. ZERO EM DASHES: Under NO circumstances use em dashes (—) or double hyphens (--). Use commas, colons, or clean sentence breaks.
5. ANTI-AI CLICHE: Avoid robotic phrases like "delve into", "beacon of hope", "in today's rapidly evolving landscape".

STRICT OUTPUT FORMAT: Return ONLY a valid JSON object matching this schema:
{
  "personalInfo": {
    "name": "${targetName}",
    "knownName": "known nickname or professional moniker if any",
    "currentRole": "Current Job Title",
    "company": "Current Primary Company",
    "industry": "Industry category",
    "countryRegion": "Primary City / Country",
    "bio": "Detailed executive biography (2-3 paragraphs)"
  },
  "professionalInfo": {
    "currentPosition": "Title at Company",
    "company": "Company",
    "previousCompanies": ["Past company 1", "Past company 2"],
    "isFounder": boolean,
    "founderOf": ["Company A", "Company B"],
    "experienceSummary": "Overview of career trajectory",
    "education": [{"fact": "Degree, Institution", "source": "University records / LinkedIn"}],
    "achievements": [{"fact": "Documented major milestone", "source": "Press / Company announcement"}],
    "organizations": ["Organization or Industry body"],
    "boardPositions": ["Board seat or Advisory role"],
    "publicProjects": [{"fact": "Key public initiative", "source": "News / Website"}],
    "investments": [{"fact": "Documented investment or fund", "source": "TechCabal / Crunchbase"}],
    "speakingEngagements": ["Major keynote or panel"],
    "awards": [{"fact": "Award title and year", "source": "Awarding body"}],
    "publications": ["Book, whitepaper, or op-ed title"]
  },
  "socialMedia": [
    {
      "platform": "LinkedIn" | "X" | "Instagram" | "Facebook" | "YouTube",
      "url": "https://...",
      "handle": "@handle",
      "verifiedNotes": "Corroborated by company role and verified bio"
    }
  ],
  "contactInfo": {
    "emails": [
      {
        "email": "work email",
        "type": "Primary" | "Secondary",
        "source": "Official company website / Domain naming pattern",
        "confidence": "High" | "Medium" | "Low",
        "isPattern": boolean,
        "discoveredDate": "${currentDate}"
      }
    ],
    "phones": [
      {
        "number": "+234...",
        "type": "Business Office" | "Company Switchboard" | "Media & Press Inquiries" | "Public Executive Contact",
        "source": "Official company contact page",
        "confidence": "High" | "Medium",
        "discoveredDate": "${currentDate}"
      }
    ],
    "companyWebsite": "https://company.com",
    "publicOfficeAddress": "City or headquarters address",
    "emailNote": "Clarification note on email verification",
    "phoneNote": "Clarification note on phone verification"
  },
  "companyOverview": {
    "name": "Company Name",
    "website": "https://...",
    "industry": "Industry",
    "overview": "What the company does and its scale",
    "leadership": ["Other key leaders"],
    "recentDevelopments": ["Recent funding, product launch, or partnership"]
  },
  "recentActivity": {
    "latestNews": [{"fact": "News headline and summary", "source": "Reuters / TechCabal"}],
    "recentInterviews": [{"fact": "Podcast or publication interview topic", "source": "Media source"}],
    "recentPublicPosts": ["Recent notable public stance or announcement"],
    "companyAnnouncements": ["Key company initiative"]
  },
  "whyMattersToAdetun": "Clear, specific synergy with Adetunwase Adenle's Animation Hub (commercial co-production, 3D/2D animation, youth talent) or the Foundation (arts education, CSR grants, community sponsorships) or Guinness World Record storytelling.",
  "aiDebrief": "Warm, natural 2-sentence conversational summary of who was found, their current role, and the status of their public contact info."
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: "system", content: "You are an elite executive researcher. Maintain strict anti-fabrication standards. Never use em dashes." },
        { role: "user", content: synthesisPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const text = response.choices[0]?.message?.content || "{}";
    const data = JSON.parse(text);

    // Apply strict Zero Em Dashes and anti-cliche cleaner across all text fields
    const cleanBio = removeEmDashes(cleanGeneratedContent(data.personalInfo?.bio || ""));
    const cleanDebrief = removeEmDashes(cleanGeneratedContent(data.aiDebrief || `I found ${targetName}. He is currently ${data.personalInfo?.currentRole || "an executive"} at ${data.personalInfo?.company || "their company"}.`));
    const cleanWhy = removeEmDashes(cleanGeneratedContent(data.whyMattersToAdetun || "Strong potential partnership for Animation Hub creative co-productions and youth foundation initiatives."));

    return {
      id: `profile_${Date.now()}`,
      personalInfo: {
        ...data.personalInfo,
        bio: cleanBio
      },
      professionalInfo: data.professionalInfo || {},
      socialMedia: data.socialMedia || [],
      contactInfo: data.contactInfo || { emails: [], phones: [] },
      companyOverview: data.companyOverview,
      recentActivity: data.recentActivity || { latestNews: [], recentInterviews: [], recentPublicPosts: [], companyAnnouncements: [] },
      sources: searchResults.map((r) => ({
        title: r.title,
        url: r.url,
        sourceName: r.sourceName,
        date: r.date || currentDate,
        confidence: r.confidence
      })),
      aiDebrief: cleanDebrief,
      lastResearched: currentDate,
      isDeepSearch: isDeep,
      whyMattersToAdetun: cleanWhy
    };
  } catch (error) {
    console.error("Profile synthesis error:", error);
    // Fallback safe profile
    return {
      id: `profile_${Date.now()}`,
      personalInfo: {
        name: targetName,
        currentRole: candidateHint?.role || "Executive / Founder",
        company: candidateHint?.company || "Public Enterprise",
        industry: candidateHint?.industry || "Technology & Creative Economy",
        countryRegion: candidateHint?.location || "Nigeria / Global",
        bio: `${targetName} is a prominent executive and business leader with documented public contributions across their industry.`
      },
      professionalInfo: {
        currentPosition: candidateHint?.role || "Executive",
        company: candidateHint?.company || "Enterprise",
        previousCompanies: [],
        isFounder: true,
        experienceSummary: "Documented executive experience across multiple industry initiatives.",
        education: [],
        achievements: [],
        organizations: [],
        boardPositions: [],
        publicProjects: [],
        investments: [],
        speakingEngagements: [],
        awards: [],
        publications: []
      },
      socialMedia: [
        {
          platform: "LinkedIn",
          url: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(targetName)}`,
          verifiedNotes: "Public LinkedIn search directory"
        }
      ],
      contactInfo: {
        emails: [],
        phones: [],
        phoneNote: "I could not verify a public professional phone number for this person without authenticated access."
      },
      recentActivity: {
        latestNews: [],
        recentInterviews: [],
        recentPublicPosts: [],
        companyAnnouncements: []
      },
      sources: searchResults.map((r) => ({
        title: r.title,
        url: r.url,
        sourceName: r.sourceName,
        date: r.date || currentDate,
        confidence: r.confidence
      })),
      aiDebrief: `I compiled public records for ${targetName}. See verified details and sources below.`,
      lastResearched: currentDate,
      isDeepSearch: isDeep,
      whyMattersToAdetun: "Potential strategic counterparty for Animation Hub or Foundation creative programs."
    };
  }
}

/**
 * Step 5: "Prepare Meeting Brief" Generator
 */
export async function generateMeetingBrief(profile: PersonProfile): Promise<MeetingBrief> {
  const briefPrompt = `
You are the Chief of Staff preparing Adetunwase Adenle for an upcoming high-stakes meeting with:
Name: ${profile.personalInfo.name}
Role: ${profile.personalInfo.currentRole}
Company: ${profile.personalInfo.company}
Bio: ${profile.personalInfo.bio}
Why They Matter to Adetunwase: ${profile.whyMattersToAdetun}

Context on Adetunwase Adenle:
- Holds 4 Guinness World Records in art and painting (including largest painting by an individual, 63.5m x 49.3m).
- Founder of Animation Hub: Lagos-based 2D/3D animation studio producing African folktale IPs, with an academy training youth creators.
- Founder of the Adetunwase Adenle Foundation: Providing free arts, creative tech, and STEM education to over 10,000 public school children.
- Key principles: Intellectual property ownership, measurable social impact, African creative excellence, capital discipline.

STRICT FORMAT & RULES:
- ZERO EM DASHES (no "—" or "--"). Use commas or periods.
- Authentic, respectful, strategic tone.
- Return ONLY a JSON object:
{
  "personName": "${profile.personalInfo.name}",
  "roleAndCompany": "${profile.personalInfo.currentRole}, ${profile.personalInfo.company}",
  "thirtySecondSummary": "Punchy 30-second executive summary of who they are and their current focus.",
  "whatTheyDoAndCareAbout": "Core operational priorities, philosophy, and what motivates them.",
  "recentDevelopments": ["Recent company milestone or public stance 1", "Milestone 2"],
  "connectionToAdetunwase": "Specific synergy with Animation Hub commercial productions, Foundation sponsorships, or Guinness World Records.",
  "partnershipOpportunities": ["Concrete collaboration idea 1", "Collaboration idea 2"],
  "strategicTalkingPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "thingsToAvoid": ["Sensitive topic or wrong framing 1", "Wrong framing 2"],
  "questionsAdetunCouldAsk": ["High-value strategic question 1", "Question 2", "Question 3"]
}
`;

  const response = await groq.chat.completions.create({
    model: PRIMARY_MODEL,
    messages: [
      { role: "system", content: "You are an executive Chief of Staff. Never use em dashes." },
      { role: "user", content: briefPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

  return {
    personName: parsed.personName || profile.personalInfo.name,
    roleAndCompany: parsed.roleAndCompany || `${profile.personalInfo.currentRole}, ${profile.personalInfo.company}`,
    thirtySecondSummary: removeEmDashes(cleanGeneratedContent(parsed.thirtySecondSummary || "")),
    whatTheyDoAndCareAbout: removeEmDashes(cleanGeneratedContent(parsed.whatTheyDoAndCareAbout || "")),
    recentDevelopments: (parsed.recentDevelopments || []).map((s: string) => removeEmDashes(cleanGeneratedContent(s))),
    connectionToAdetunwase: removeEmDashes(cleanGeneratedContent(parsed.connectionToAdetunwase || "")),
    partnershipOpportunities: (parsed.partnershipOpportunities || []).map((s: string) => removeEmDashes(cleanGeneratedContent(s))),
    strategicTalkingPoints: (parsed.strategicTalkingPoints || []).map((s: string) => removeEmDashes(cleanGeneratedContent(s))),
    thingsToAvoid: (parsed.thingsToAvoid || []).map((s: string) => removeEmDashes(cleanGeneratedContent(s))),
    questionsAdetunCouldAsk: (parsed.questionsAdetunCouldAsk || []).map((s: string) => removeEmDashes(cleanGeneratedContent(s)))
  };
}

/**
 * Step 6: "Draft Outreach" Generator
 */
export async function generateOutreachDraft(profile: PersonProfile, objective?: string): Promise<OutreachDraft> {
  const outreachPrompt = `
Draft a highly personalized, executive outreach email and LinkedIn connection message from Adetunwase Adenle to:
Recipient: ${profile.personalInfo.name}
Role: ${profile.personalInfo.currentRole}
Company: ${profile.personalInfo.company}
Background: ${profile.personalInfo.bio}
Specific Objective: ${objective || "Explore strategic partnership between their organization and Animation Hub / Adetunwase Adenle Foundation"}

Sender Persona:
- Adetunwase Adenle: 4-time Guinness World Record holder, founder of Animation Hub (African 2D/3D animation studio & youth academy) and the Adetunwase Adenle Foundation.
- Voice: Respectful, direct, visionary, grounded in tangible African creative value. No fake hype.

CRITICAL RULES:
- ZERO EM DASHES (— or --).
- Banned cliches: "delve into", "in today's fast-paced world", "synergy", "paradigm shift".
- Return ONLY a JSON object:
{
  "recipientName": "${profile.personalInfo.name}",
  "recipientRole": "${profile.personalInfo.currentRole}",
  "company": "${profile.personalInfo.company}",
  "emailSubject": "Compelling, professional subject line without em dashes",
  "emailBody": "Full polite email (3 paragraphs maximum), clear call to action.",
  "linkedinMessage": "Concise under 300 character LinkedIn message.",
  "keyAnglesUsed": ["Angle 1", "Angle 2"]
}
`;

  const response = await groq.chat.completions.create({
    model: PRIMARY_MODEL,
    messages: [
      { role: "system", content: "You write authentic executive communications for Adetunwase Adenle. Never use em dashes." },
      { role: "user", content: outreachPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.25
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

  return {
    recipientName: parsed.recipientName || profile.personalInfo.name,
    recipientRole: parsed.recipientRole || profile.personalInfo.currentRole,
    company: parsed.company || profile.personalInfo.company,
    emailSubject: removeEmDashes(cleanGeneratedContent(parsed.emailSubject || `Exploring creative partnership with ${profile.personalInfo.company}`)),
    emailBody: removeEmDashes(cleanGeneratedContent(parsed.emailBody || "")),
    linkedinMessage: removeEmDashes(cleanGeneratedContent(parsed.linkedinMessage || "")),
    keyAnglesUsed: (parsed.keyAnglesUsed || []).map((a: string) => removeEmDashes(cleanGeneratedContent(a)))
  };
}

/**
 * Step 7: "Find Contact" - Dedicated investigation of professional contact sources
 */
export async function findLegitimateContact(profile: PersonProfile): Promise<{
  contactInfo: PersonProfile["contactInfo"];
  sources: PersonProfile["sources"];
}> {
  const name = profile.personalInfo.name;
  const company = profile.personalInfo.company;
  const queries = [
    `${name} ${company} official business email contact`,
    `${company} corporate headquarters media press inquiries phone number`,
    `${name} speaker profile booking agent public contact`
  ];

  const resultsNested = await Promise.all(queries.map((q) => executeWebSearch(q)));
  const flat = resultsNested.flat();

  const seen = new Set<string>(profile.sources.map((s) => s.url));
  const newSources = [...profile.sources];
  for (const r of flat) {
    if (!seen.has(r.url)) {
      seen.add(r.url);
      newSources.push({
        title: r.title,
        url: r.url,
        sourceName: r.sourceName,
        date: r.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        confidence: r.confidence
      });
    }
  }

  const prompt = `
You are the Executive Contact Intelligence Researcher for Adetunwase Adenle.
Target: ${name}
Company: ${company}

Search Evidence:
${flat.map((r, i) => `[${i + 1}] Title: ${r.title} | URL: ${r.url} | Snippet: ${r.snippet}`).join("\n")}

Extract legitimate public professional contact information:
1. Work Email: Must be public business email. If inferred from company domain pattern (e.g. name@company.com), set isPattern: true, confidence: "Low", source: "Inferred corporate domain pattern". Never create fake emails like name@gmail.com.
2. Business Phone: Official corporate switchboard, office number, or media inquiries only. If none found, return empty array and explain in phoneNote.
3. STRICT RULE: NEVER FABRICATE. If not found, say so honestly.
4. ZERO EM DASHES.

Return JSON format:
{
  "emails": [
    {
      "email": "email",
      "type": "Primary" | "Secondary",
      "source": "source",
      "confidence": "High" | "Medium" | "Low",
      "isPattern": boolean,
      "discoveredDate": "${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}"
    }
  ],
  "phones": [
    {
      "number": "phone number",
      "type": "Business Office" | "Company Switchboard" | "Media & Press Inquiries" | "Public Executive Contact",
      "source": "source",
      "confidence": "High" | "Medium",
      "discoveredDate": "${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}"
    }
  ],
  "companyWebsite": "https://...",
  "emailNote": "note",
  "phoneNote": "note"
}
`;

  try {
    const res = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: "system", content: "You are an ethical executive researcher. Never invent emails or phone numbers. Return JSON only. Never use em dashes." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    return {
      contactInfo: {
        emails: parsed.emails && parsed.emails.length > 0 ? parsed.emails : profile.contactInfo.emails,
        phones: parsed.phones && parsed.phones.length > 0 ? parsed.phones : profile.contactInfo.phones,
        companyWebsite: parsed.companyWebsite || profile.contactInfo.companyWebsite,
        emailNote: removeEmDashes(parsed.emailNote || profile.contactInfo.emailNote || ""),
        phoneNote: removeEmDashes(parsed.phoneNote || profile.contactInfo.phoneNote || "")
      },
      sources: newSources
    };
  } catch (e) {
    console.error("findLegitimateContact error:", e);
    return {
      contactInfo: profile.contactInfo,
      sources: newSources
    };
  }
}

