/**
 * Comprehensive Knowledge Seed for Adetunwase Adenle AI
 * Sources: Wikipedia, Vanguard, Guardian, ThisDay Live, BellaNaija, The Nation, The Sun
 * Run: npx tsx prisma/knowledge-seed.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const allFacts = [
  // ==================== PERSONAL IDENTITY ====================
  {
    fact: "Adetunwase Adenle's full birth name is Adetunwase Akanni Adenle.",
    entity: "PERSONAL", category: "Identity", source: "Wikipedia", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle is a Nigerian art educator, artist, social entrepreneur, and multiple Guinness World Record holder.",
    entity: "PERSONAL", category: "Identity", source: "Wikipedia / Vanguard", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle has a personal website at https://www.adetunwase.com/",
    entity: "PERSONAL", category: "Contact", source: "Wikipedia", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle is a Yoruba Nigerian. His work is deeply rooted in Nigerian culture, African heritage, and community empowerment.",
    entity: "PERSONAL", category: "Identity", source: "Public Record", confidence: "High", privacy: "Public"
  },

  // ==================== EDUCATION ====================
  {
    fact: "Adetunwase Adenle studied Fine and Applied Art at the Federal College of Education (Technical), Akoka, Lagos.",
    entity: "PERSONAL", category: "Education", source: "Wikipedia", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle is co-founder of Ecole de Dessin School of Art.",
    entity: "PERSONAL", category: "Education / Organisations", source: "Wikipedia", confidence: "High", privacy: "Public"
  },

  // ==================== GUINNESS WORLD RECORDS ====================
  {
    fact: "Adetunwase Adenle holds FOUR Guinness World Records. He is a four-time Guinness World Record holder.",
    entity: "PERSONAL", category: "Milestone", source: "Wikipedia / Guinness World Records", confidence: "High", privacy: "Public"
  },
  {
    fact: "Guinness World Record 1: Largest Painting by Numbers (also described as Largest Painting by an Individual). The painting measured 63.5 meters by 49.3 meters (approximately 3,130.55 square meters). It was created in 2010 during the Nigeria at 50 independence celebrations. It depicted the map of Nigeria, the Nigerian flag, and the 350.org climate change logo. It was completed by 350 volunteers.",
    entity: "PERSONAL", category: "Milestone", source: "Wikipedia / BellaNaija / Facebook Records", confidence: "High", privacy: "Public"
  },
  {
    fact: "Guinness World Record 2: Most Children Reading Aloud with an Adult. Set on September 8, 2011, in Oregun, Lagos, to commemorate International Literacy Day (World Literacy Day). The record involved 4,222 children reading aloud with an adult. The event was co-organized with Adejoke Orelope-Adefulire, the former Deputy Governor of Lagos State.",
    entity: "PERSONAL", category: "Milestone", source: "Wikipedia / MySchool.ng", confidence: "High", privacy: "Public"
  },
  {
    fact: "Guinness World Record 3: Highest Number of Children Washing Their Hands Simultaneously. This record was set in partnership with Unilever's Lifebuoy soap brand to promote personal hygiene among children.",
    entity: "PERSONAL", category: "Milestone", source: "Wikipedia / TalkAfricana", confidence: "High", privacy: "Public"
  },
  {
    fact: "Guinness World Record 4: World's Largest Special Stamp. Created in 2016 at Top Laurel School, Lagos. The stamp measured 2.448 square meters. It was created to commemorate the 50th anniversary of the creation of Lagos State.",
    entity: "PERSONAL", category: "Milestone", source: "Wikipedia / MySchool.ng", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle is currently working toward a fifth Guinness World Record: a legacy painting that will engage 10,000 young Nigerians in creating a 1,040-foot-long artwork telling the story of Nigeria's 130-year history (65 years before and 65 years after independence).",
    entity: "PERSONAL", category: "Milestone / Upcoming", source: "The Nation / Vanguard (August 2025)", confidence: "High", privacy: "Public"
  },

  // ==================== SLUM ART FOUNDATION ====================
  {
    fact: "Adetunwase Adenle is co-founder of the Slum Art Foundation, based in Ijora Badia, Lagos, Nigeria.",
    entity: "FOUNDATION", category: "Organisation", source: "Wikipedia / Vanguard", confidence: "High", privacy: "Public"
  },
  {
    fact: "The Slum Art Foundation uses art as a tool for social change, empowerment, and education for children living in slum communities, particularly Ijora Badia in Lagos.",
    entity: "FOUNDATION", category: "Mission", source: "Vanguard / Guardian / BellaNaija", confidence: "High", privacy: "Public"
  },
  {
    fact: "Through the Slum Art Foundation, Adetunwase provides free training in visual arts and animation to indigent (low-income) children, helping them build professional creative skills.",
    entity: "FOUNDATION", category: "Programme", source: "Vanguard", confidence: "High", privacy: "Public"
  },
  {
    fact: "The Slum Art Foundation has a 'pet bottle school' in Ijora Badia, Lagos. The school building is constructed from recycled plastic PET bottles, symbolising sustainability, recycling, and art.",
    entity: "FOUNDATION", category: "Infrastructure", source: "Vanguard / The Nation", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle is known for his upcycling and recycle-art work, transforming discarded materials like magazines, newspapers, and plastic bottles into artworks to promote environmental sustainability.",
    entity: "PERSONAL", category: "Philosophy / Art Style", source: "Wikipedia / hug.art", confidence: "High", privacy: "Public"
  },
  {
    fact: "The Slum Art Foundation teaches children values like teamwork, civic responsibility, and hard work through art and creative education.",
    entity: "FOUNDATION", category: "Philosophy", source: "Vanguard / Wikipedia", confidence: "High", privacy: "Public"
  },

  // ==================== ANIMATION HUB ====================
  {
    fact: "Adetunwase Adenle is a co-founder and the leading figure of Animation Hub, established in 2020 and based in Lagos, Nigeria.",
    entity: "ANIMATION_HUB", category: "Organisation", source: "AnimationHub.ng / ThisDay Live", confidence: "High", privacy: "Public"
  },
  {
    fact: "Animation Hub's mission is to grow the Nigerian animation industry by providing a platform for creators, meeting international standards, and producing high-quality original local animated content.",
    entity: "ANIMATION_HUB", category: "Mission", source: "AnimationHub.ng", confidence: "High", privacy: "Public"
  },
  {
    fact: "Animation Hub is a Lagos-based animation studio and creative training academy that trains young African animators in 2D, 3D, visual effects, motion graphics, and digital storytelling.",
    entity: "ANIMATION_HUB", category: "Services", source: "AnimationHub.ng / Public Record", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle has been associated with 'The Nigeria Story', a large-scale collaborative animation project connected to Animation Hub.",
    entity: "ANIMATION_HUB", category: "Project", source: "Facebook / Public Record", confidence: "Medium", privacy: "Public"
  },

  // ==================== FEATURE EARTH AI CREATORS PROGRAMME ====================
  {
    fact: "Adetunwase Adenle launched the Feature Earth AI Creators Programme on June 5, 2026 (World Environment Day). It is a nationwide Nigerian initiative targeting children aged 8-15.",
    entity: "FOUNDATION", category: "Programme", source: "Guardian Nigeria / ThisDay Live", confidence: "High", privacy: "Public"
  },
  {
    fact: "The Feature Earth AI Creators Programme aims to train Nigerian children in artificial intelligence (AI), animation, digital storytelling, and environmental innovation.",
    entity: "FOUNDATION", category: "Programme", source: "Guardian Nigeria / Vanguard", confidence: "High", privacy: "Public"
  },
  {
    fact: "The Feature Earth AI programme targets 5,760 schools across Nigeria, aiming to reach over 138,000 children. Each participating school selects 24 children.",
    entity: "FOUNDATION", category: "Programme Scale", source: "Guardian Nigeria / The Sun", confidence: "High", privacy: "Public"
  },
  {
    fact: "The Feature Earth AI Creators Programme is backed by First City Monument Bank (FCMB) as a partner.",
    entity: "FOUNDATION", category: "Partnership", source: "Vanguard", confidence: "High", privacy: "Public"
  },
  {
    fact: "As part of the Feature Earth AI vision, Adetunwase Adenle established an AI Animation Hub inside the Ijora Badia slum community in Lagos. The facility is built from recycled plastic (PET) bottles, combining sustainability with advanced technology.",
    entity: "FOUNDATION", category: "Infrastructure", source: "The Nation", confidence: "High", privacy: "Public"
  },
  {
    fact: "The Feature Earth AI Creators Programme teaches children to use AI tools to tell visual stories about environmental issues like plastic pollution, flooding, climate change, and waste management.",
    entity: "FOUNDATION", category: "Programme Content", source: "Guardian Nigeria / Vanguard", confidence: "High", privacy: "Public"
  },

  // ==================== PHILOSOPHY & IMPACT ====================
  {
    fact: "Adetunwase Adenle's core philosophy is using art, creativity, and technology as tools to uplift disadvantaged children and communities across Nigeria and Africa.",
    entity: "PERSONAL", category: "Philosophy", source: "Multiple Public Sources", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle advocates strongly for STEAM (Science, Technology, Engineering, Arts, Mathematics) education for children in underserved Nigerian and African communities.",
    entity: "PERSONAL", category: "Philosophy", source: "Guardian / Vanguard", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle's record-breaking projects are intentionally designed to be collaborative and community-driven, often involving hundreds or thousands of volunteers and children.",
    entity: "PERSONAL", category: "Art Style / Philosophy", source: "BellaNaija / MySchool.ng", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle is known for large-scale 'legacy projects' designed to leave a lasting cultural, educational, and social impact on Nigerian youth and communities.",
    entity: "PERSONAL", category: "Philosophy", source: "Vanguard / The Nation", confidence: "High", privacy: "Public"
  },

  // ==================== MEDIA & PUBLIC PROFILE ====================
  {
    fact: "Adetunwase Adenle has been featured in major Nigerian and international media outlets including Vanguard, Guardian Nigeria, The Nation, ThisDay Live, BellaNaija, and The Sun.",
    entity: "PERSONAL", category: "Media", source: "Multiple Public Records", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle has a Wikipedia page at https://en.wikipedia.org/wiki/Adetunwase_Adenle with pages in 5 languages: English, Hausa, Igbo, Swahili, Yoruba, and Urdu.",
    entity: "PERSONAL", category: "Public Profile", source: "Wikipedia", confidence: "High", privacy: "Public"
  },
  {
    fact: "Wikipedia categorises Adetunwase Adenle as: Nigerian art educator, World record holder, Literacy advocate, 21st-century Nigerian male artist, 21st-century Nigerian painter.",
    entity: "PERSONAL", category: "Identity", source: "Wikipedia", confidence: "High", privacy: "Public"
  },

  // ==================== PROFESSIONAL ROLES ====================
  {
    fact: "Adetunwase Adenle's official occupation title is Art Educator. He is also an artist, social entrepreneur, and animator.",
    entity: "PERSONAL", category: "Professional", source: "Wikipedia", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle operates professionally across three main entities: his Personal brand (Adetunwase Adenle), Animation Hub (the studio and academy), and the Slum Art Foundation (the community empowerment NGO).",
    entity: "PERSONAL", category: "Professional Structure", source: "Public Record", confidence: "High", privacy: "Public"
  },
  {
    fact: "Adetunwase Adenle's email used professionally is adetunwase@animationhub.tv",
    entity: "PERSONAL", category: "Contact", source: "Internal Record", confidence: "High", privacy: "Private"
  },
];

async function main() {
  console.log(`Seeding ${allFacts.length} knowledge facts about Adetunwase Adenle...`);

  let added = 0;
  let skipped = 0;

  for (const fact of allFacts) {
    try {
      // Check if a very similar fact already exists (avoid duplicates)
      const existing = await prisma.knowledgeFact.findFirst({
        where: {
          fact: { contains: fact.fact.slice(0, 60) },
          entity: fact.entity
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.knowledgeFact.create({
        data: {
          fact: fact.fact,
          entity: fact.entity,
          category: fact.category,
          source: fact.source,
          confidence: fact.confidence,
          privacy: fact.privacy,
          lastVerified: new Date(),
        }
      });
      added++;
    } catch (err) {
      console.error(`Failed to insert: ${fact.fact.slice(0, 60)}...`, err);
    }
  }

  console.log(`Done. Added: ${added} new facts. Skipped (already exist): ${skipped}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
