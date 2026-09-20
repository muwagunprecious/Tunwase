/**
 * Adetunwase Personal Brand & SlumArt Foundation Knowledge Engine
 * Enforces strict separation between personal achievements and foundation initiatives.
 */

import { prisma } from "@/lib/prisma";

export interface PersonalBrandProfile {
  fullName: string;
  title: string;
  biography: string;
  background: string;
  education: string;
  expertise: string[];
  values: string[];
  beliefs: string[];
  vision: string;
  causes: string[];
  achievements: string[];
  currentProjects: string[];
  communicationStyle: {
    tone: string;
    rules: string[];
    humility: string;
  };
}

export interface SlumArtFoundationProfile {
  name: string;
  mission: string;
  vision: string;
  location: string;
  communitiesServed: string[];
  keyPrograms: Array<{
    name: string;
    description: string;
    impact: string;
  }>;
  verifiedStatistics: string[];
  infrastructure: string;
  partnerships: string[];
  coreValues: string[];
}

export const ADETUNWASE_PERSONAL_BRAND: PersonalBrandProfile = {
  fullName: "Adetunwase Akanni Adenle",
  title: "Guinness World Record Artist, Art Educator & Founder",
  biography:
    "Adetunwase Akanni Adenle is a Nigerian art educator, artist, animator, and multiple Guinness World Record holder dedicated to empowering young people through creative arts, animation, and technology.",
  background:
    "Trained in Fine and Applied Art at the Federal College of Education (Technical), Akoka, Lagos. Co-founder of Ecole de Dessin School of Art.",
  education: "Fine and Applied Art, Federal College of Education (Technical), Akoka, Lagos",
  expertise: [
    "Large-scale community art projects",
    "Creative youth mentorship",
    "STEAM education (Science, Technology, Engineering, Arts, Math)",
    "2D and 3D African animation production",
    "Upcycling and sustainable recycle-art"
  ],
  values: [
    "Hands-on hard work and discipline over talk",
    "Cultural pride in authentic African heritage",
    "Belief in the raw creative brilliance of every child",
    "Environmental sustainability and practical recycling",
    "Resilience in the face of rejection and systemic obstacles"
  ],
  beliefs: [
    "Creativity is an equalizer that gives underserved children global standing.",
    "Art is not just decoration; it is an economic engine and educational tool.",
    "True leadership means building platforms where children become the stars."
  ],
  vision:
    "To pioneer world-class African animation and transform underserved communities across Africa into thriving centers of creative technology.",
  causes: [
    "Slum youth education and digital literacy",
    "Environmental sustainability through recycle-art",
    "Pioneering authentic African animated storytelling"
  ],
  achievements: [
    "Guinness World Record (2010): Largest Painting by Numbers (63.5m x 49.3m, 3,130.55 sq m with 350 volunteers for Nigeria at 50)",
    "Guinness World Record (2011): Most Children Reading Aloud with an Adult (4,222 children in Oregun, Lagos on International Literacy Day)",
    "Guinness World Record: Highest Number of Children Washing Hands Simultaneously (with Lifebuoy soap)",
    "Guinness World Record (2016): World's Largest Special Stamp (2.448 sq m for Lagos at 50)",
    "Current legacy project: 1,040-foot painting with 10,000 youth illustrating Nigeria's 130-year history"
  ],
  currentProjects: [
    "Animation Hub studio production of original African IP",
    "Feature Earth AI Creators Programme in schools across Nigeria",
    "1,040-foot historic legacy painting project"
  ],
  communicationStyle: {
    tone: "Grounded, warm, reflective, conversational, hopeful without fake hype",
    rules: [
      "Never use big English or corporate buzzwords",
      "Speak directly as a mentor and hands-on creator",
      "Focus on lessons learned from real experiences",
      "Never exaggerate numbers or invent experiences"
    ],
    humility: "Spotlight the youth, community, and team rather than personal vanity"
  }
};

export const SLUMART_FOUNDATION_KNOWLEDGE: SlumArtFoundationProfile = {
  name: "Slum Art Foundation",
  mission:
    "To use creative arts, design, and digital technology as sustainable vehicles to educate, mentor, and empower children and youth living in underserved slum communities.",
  vision:
    "A world where a child's socio-economic background never limits their creative and economic potential.",
  location: "Ijora Badia, Lagos, Nigeria",
  communitiesServed: ["Ijora Badia", "Makoko", "Underserved Lagos urban settlements"],
  keyPrograms: [
    {
      name: "Pet Bottle School & Art Hub",
      description:
        "A physical community learning center in Ijora Badia constructed from thousands of recycled PET plastic bottles, demonstrating recycling, architecture, and art.",
      impact: "Provides free daily visual art, sketching, painting, and digital animation classes to vulnerable children."
    },
    {
      name: "Feature Earth AI Creators Programme",
      description:
        "Launched on World Environment Day (June 5, 2026), equipping Nigerian children with skills in AI tools, animation, digital storytelling, and environmental conservation.",
      impact: "Targeting 5,760 schools and over 138,000 children nationwide, partnered with FCMB."
    },
    {
      name: "Youth Visual Arts & Animation Mentorship",
      description:
        "Long-term mentorship program moving children from rudimentary drawing to professional digital illustration, 2D animation, and creative careers.",
      impact: "Multiple young beneficiaries now creating commissioned artwork and digital assets."
    }
  ],
  verifiedStatistics: [
    "Over 1,000 children directly trained in visual art and creative expression in Ijora Badia",
    "School facility built from recycled plastic bottles, diverting tons of waste from Lagos waterways",
    "5,760 schools targeted in nationwide AI Creators initiative"
  ],
  infrastructure:
    "The Slum Art Pet Bottle School in Ijora Badia, equipped with art materials, digital screens, and drawing tables.",
  partnerships: [
    "First City Monument Bank (FCMB)",
    "Community youth development groups in Lagos",
    "Environmental sustainability organizations"
  ],
  coreValues: [
    "Community trust and local roots",
    "Dignity of every child",
    "Environmental responsibility and upcycling",
    "Skill-building for real economic self-reliance"
  ]
};

/**
 * Returns structured brand context formatted for the LinkedIn generation prompt.
 * Ensures entity separation is made explicitly clear to the AI model.
 */
export async function getStructuredBrandContext(entityTarget: "PERSONAL" | "FOUNDATION" | "BOTH") {
  // Load dynamic knowledge facts from DB if available
  const dbFacts = await prisma.knowledgeFact.findMany({
    where: { privacy: { not: "Private" } },
    take: 80,
    orderBy: { updatedAt: "desc" }
  }).catch(() => []);

  const personalFacts = dbFacts.filter((f) => f.entity === "PERSONAL").map((f) => f.fact);
  const foundationFacts = dbFacts.filter((f) => f.entity === "FOUNDATION").map((f) => f.fact);

  return {
    personalBrand: {
      ...ADETUNWASE_PERSONAL_BRAND,
      additionalVerifiedFacts: personalFacts
    },
    slumArtFoundation: {
      ...SLUMART_FOUNDATION_KNOWLEDGE,
      additionalVerifiedFacts: foundationFacts
    },
    entityIndependenceRule: `
IMPORTANT ENTITY SEPARATION RULES:
1. Adetunwase Adenle Personally and SlumArt Foundation are connected but NOT identical.
2. If this is a PERSONAL post, it should focus on Adetunwase's observations, lessons, leadership, creative philosophy, or personal experiences. It does NOT automatically need to mention SlumArt Foundation.
3. If this is a SLUMART FOUNDATION post, the spotlight belongs to the children, the community of Ijora Badia, educational impact, or programs (e.g. Pet Bottle School). It must NOT be framed as a personal trophy.
4. Never blur budgets, organizational claims, or roles.
`
  };
}
