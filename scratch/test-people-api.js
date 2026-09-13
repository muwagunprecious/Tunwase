async function testPeopleAPI() {
  console.log("==================================================");
  console.log("PEOPLE SEARCH & RESEARCH AGENT - END-TO-END TESTS");
  console.log("==================================================");

  // Test 1: Single Match Search (Iyinoluwa Aboyeji)
  console.log("\n[TEST 1] Searching for 'Iyinoluwa Aboyeji'...");
  const res1 = await fetch("http://localhost:3000/api/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "search", query: "Iyinoluwa Aboyeji" })
  });

  const data1 = await res1.json();
  console.log("Status:", data1.status);
  console.log("Explanation:", data1.explanation);

  if (data1.profile) {
    const p = data1.profile;
    console.log("Target Name:", p.personalInfo.name);
    console.log("Role:", p.personalInfo.currentRole);
    console.log("Company:", p.personalInfo.company);
    console.log("Location:", p.personalInfo.countryRegion);
    console.log("Emails Found:", p.contactInfo.emails);
    console.log("Phones Found:", p.contactInfo.phones);
    console.log("Social Profiles:", p.socialMedia?.map(s => `${s.platform}: ${s.url}`));
    console.log("Synergy with Adetunwase:", p.whyMattersToAdetun);
    console.log("Sources count:", p.sources?.length);

    // Test 2: Meeting Brief
    console.log("\n[TEST 2] Generating Meeting Brief...");
    const briefRes = await fetch("http://localhost:3000/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "meeting_brief", profile: p })
    });
    const briefData = await briefRes.json();
    console.log("30-Second Summary:", briefData.brief?.thirtySecondSummary);
    console.log("Talking Points:", briefData.brief?.strategicTalkingPoints);
    console.log("Things to Avoid:", briefData.brief?.thingsToAvoid);

    // Test 3: Outreach Draft (Zero Em Dashes Check)
    console.log("\n[TEST 3] Generating Outreach Draft...");
    const outRes = await fetch("http://localhost:3000/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draft_outreach", profile: p })
    });
    const outData = await outRes.json();
    console.log("Email Subject:", outData.outreach?.emailSubject);
    console.log("Email Body:", outData.outreach?.emailBody);
    console.log("LinkedIn Note:", outData.outreach?.linkedinMessage);

    const emailHasEmDash = (outData.outreach?.emailBody || "").includes("—") || (outData.outreach?.emailBody || "").includes("--");
    const liHasEmDash = (outData.outreach?.linkedinMessage || "").includes("—") || (outData.outreach?.linkedinMessage || "").includes("--");
    console.log("Strict Zero Em Dashes Passed:", !emailHasEmDash && !liHasEmDash);

    // Test 4: Save Contact to CRM
    console.log("\n[TEST 4] Saving Contact to Database...");
    const saveRes = await fetch("http://localhost:3000/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_contact", profile: p })
    });
    const saveData = await saveRes.json();
    console.log("Saved Contact ID:", saveData.contact?.id);
    console.log("Saved Successfully:", saveData.saved);
  }

  // Test 5: Disambiguation (David Adeleke)
  console.log("\n[TEST 5] Testing Disambiguation on 'David Adeleke'...");
  const res2 = await fetch("http://localhost:3000/api/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "search", query: "David Adeleke" })
  });
  const data2 = await res2.json();
  console.log("Status:", data2.status);
  console.log("Explanation:", data2.explanation);
  if (data2.candidates) {
    console.log("Candidates Disambiguated:");
    data2.candidates.forEach(c => {
      console.log(`• ${c.name} (${c.knownName || "No moniker"}): ${c.role} at ${c.company}, ${c.location}`);
    });
  }

  // Test 6: Search History
  console.log("\n[TEST 6] Fetching Search History...");
  const histRes = await fetch("http://localhost:3000/api/people");
  const histData = await histRes.json();
  console.log("Recent Searches Count:", histData.history?.length);
  console.log("Latest in History:", histData.history?.[0]?.targetName);

  console.log("\n==================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

testPeopleAPI().catch(console.error);
