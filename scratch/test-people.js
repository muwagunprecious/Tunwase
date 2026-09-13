const { investigatePerson, generateMeetingBrief, generateOutreachDraft } = require("../src/lib/agents/people-search");

async function test() {
  console.log("=== TEST 1: Single-Match People Search (Iyinoluwa Aboyeji) ===");
  const res1 = await investigatePerson("Iyinoluwa Aboyeji");
  console.log("Status:", res1.status);
  console.log("Explanation:", res1.explanation);
  if (res1.profile) {
    console.log("Name:", res1.profile.personalInfo.name);
    console.log("Current Role:", res1.profile.personalInfo.currentRole);
    console.log("Company:", res1.profile.personalInfo.company);
    console.log("Emails Found:", res1.profile.contactInfo.emails);
    console.log("Phones Found:", res1.profile.contactInfo.phones);
    console.log("Social Media:", res1.profile.socialMedia?.map(s => `${s.platform}: ${s.url}`));
    console.log("Why it matters to Adetunwase:", res1.profile.whyMattersToAdetun);
  }

  console.log("\n=== TEST 2: Disambiguation (David Adeleke) ===");
  const res2 = await investigatePerson("David Adeleke");
  console.log("Status:", res2.status);
  console.log("Explanation:", res2.explanation);
  if (res2.candidates) {
    console.log("Candidates detected:", res2.candidates.length);
    res2.candidates.forEach(c => {
      console.log(`- ${c.name} (${c.knownName || "N/A"}): ${c.role} at ${c.company}, ${c.location}`);
    });
  }

  if (res1.profile) {
    console.log("\n=== TEST 3: Meeting Brief Generation ===");
    const brief = await generateMeetingBrief(res1.profile);
    console.log("30-Second Summary:", brief.thirtySecondSummary);
    console.log("Strategic Talking Points:", brief.strategicTalkingPoints);
    console.log("Things to Avoid:", brief.thingsToAvoid);

    console.log("\n=== TEST 4: Outreach Draft (Zero Em Dashes Check) ===");
    const outreach = await generateOutreachDraft(res1.profile);
    console.log("Subject:", outreach.emailSubject);
    console.log("Body:", outreach.emailBody);
    console.log("LinkedIn Note:", outreach.linkedinMessage);

    const hasEmDash = outreach.emailBody.includes("—") || outreach.emailBody.includes("--") ||
                      outreach.linkedinMessage.includes("—") || outreach.linkedinMessage.includes("--");
    console.log("Em Dash Check Passed:", !hasEmDash);
  }
}

test().catch(console.error);
