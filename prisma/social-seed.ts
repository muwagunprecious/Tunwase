/**
 * Social Engine Seeding Script
 * Run: npx tsx prisma/social-seed.ts
 */

import { prisma } from "@/lib/prisma";
import { ensureInitialReferenceWriter, addReferencePost, analyzeReferenceStyle } from "@/lib/social/reference-writer-engine";
import { ensureWritingProfile } from "@/lib/social/editor-learning-loop";
import { ingestRawContext } from "@/lib/social/context-engine";
import { generateDailyLinkedInBank, getEngineSettings } from "@/lib/social/daily-caption-generator";

async function main() {
  console.log("Seeding LinkedIn Social Media Intelligence & Content Management System...");

  // 1. Ensure Engine Settings
  await getEngineSettings();
  console.log("1. Engine settings verified (Daily: 7, Min Backlog: 30).");

  // 2. Reference Writer: Tunde Onakoya
  const refWriter = await ensureInitialReferenceWriter();
  console.log(`2. Reference writer verified: ${refWriter.name} (${refWriter.linkedinUrl})`);

  // 3. Add public reference post samples for storytelling architecture
  const samplePosts = [
    {
      topic: "Hope and Potential in Slums",
      postText: `Five years ago, we walked into a slum community in Lagos with nothing but a few chessboards and a belief that brilliance is evenly distributed.

We met children whose dreams had never been asked for.
We sat with them on wooden benches, moving wooden pieces across black and white squares.

Yesterday, one of those same young boys earned a scholarship to study software engineering.

The lesson is simple:
Talent does not belong to a zip code.
Opportunity does.

When we build platforms where vulnerable children can step into their dignity, they don't just participate. They lead.

What overlooked opportunity in your community can you unlock this week?`
    },
    {
      topic: "Resilience & The Long Walk",
      postText: `Behind every milestone is an unseen season of discipline that nobody photographed.

When we attempted the 60-hour marathon in Times Square, my physical body reached its limit on hour 42.
The cold was unforgiving. My hands cramped.
Every internal signal suggested stopping.

Then I remembered why we were there:
Not for a certificate, but for the millions of children who wake up every single morning fighting invisible battles without a camera watching.

True endurance isn't loud.
It is the quiet decision to take one more step when every logical argument tells you to quit.

Keep building quietly. The outcome will speak.`
    },
    {
      topic: "Community Leadership",
      postText: `A lot of people ask me how we measure social impact.

Is it the number of chessboards?
Is it the media headlines?
Is it the partnerships signed?

For me, it happened this morning.
A 10-year-old girl in our community hub sat down opposite a first-time visitor.
She didn't look at his suit or his credentials.
She smiled, shook his hand, and calmly offered him the white pieces.

She knew she belonged at the table.

Leadership is not about creating followers.
It is about creating young people who know they have a seat at any table on earth.`
    }
  ];

  for (const post of samplePosts) {
    const existing = await prisma.referencePost.findFirst({
      where: { writerId: refWriter.id, topic: post.topic }
    });
    if (!existing) {
      await addReferencePost({
        writerId: refWriter.id,
        postText: post.postText,
        topic: post.topic,
        sourceType: "MANUAL_INPUT"
      });
    }
  }
  console.log("3. Reference posts ingested safely.");

  // 4. Analyze High-Level Structural Characteristics
  const styleProfile = await analyzeReferenceStyle(refWriter.id);
  console.log("4. Generalized storytelling profile generated:", styleProfile.tone);

  // 5. Adetunwase Writing Profile
  const writingProfile = await ensureWritingProfile();
  console.log("5. Adetunwase Writing Profile initialized:", writingProfile.emotionalTone);

  // 6. Ingest Real Field Context Experiences
  const fieldExperiences = [
    `I spent yesterday afternoon at the Slum Art Pet Bottle School in Ijora Badia. Over 35 children were seated on wooden benches sketching character concepts for an African animated series. A 9-year-old girl showed me her drawings on recycled cardboards and explained that her character was a solar engineer from Lagos who protects the waters. The raw imagination inside these communities is unbelievable.`,
    `Reflecting today on our 2010 Nigeria at 50 record with 350 volunteers painting across 3,130 square meters. People told us it was logistically impossible to coordinate that many children on one giant canvas. But when you give young people ownership and trust their discipline, they will astonish you every single time.`
  ];

  for (const exp of fieldExperiences) {
    await ingestRawContext(exp);
  }
  console.log("6. Real field contexts ingested.");

  // 7. Generate Initial Caption Bank to seed the backlog
  console.log("7. Generating initial daily caption bank (7 captions)...");
  const batchResult = await generateDailyLinkedInBank({ batchSize: 7 });
  console.log(`Done. Generated ${batchResult.generatedCount} captions. Active backlog: ${batchResult.totalBacklog}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
