import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Adetunwase Adenle AI Personal Assistant database...");

  // 1. User
  await prisma.user.upsert({
    where: { email: "adetunwase@animationhub.tv" },
    update: {},
    create: {
      name: "Adetunwase Adenle",
      email: "adetunwase@animationhub.tv",
      title: "Guinness World Record Artist, Educator & Founder",
      bio: "Multiple Guinness World Record holder, creative director, educator, and entrepreneur. Founder of Animation Hub and the Adetunwase Adenle Foundation, committed to pioneering African animation and empowering youth through creative arts and technology."
    }
  });

  // 2. Knowledge Facts across 3 distinct namespaces
  const facts = [
    // --- PERSONAL BRAND ---
    {
      fact: "Adetunwase Adenle is a Nigerian artist, teacher, and creative visionary who holds four Guinness World Records in art and education.",
      entity: "PERSONAL",
      category: "Milestone",
      source: "Guinness World Records Official Archive",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Holds the Guinness World Record for the largest painting by an individual, measuring 63.5 meters by 49.3 meters, created with students in Lagos, Nigeria.",
      entity: "PERSONAL",
      category: "Milestone",
      source: "Guinness World Records / Vanguard News",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Recognized as a passionate advocate for youth education, using art and creative technology to inspire children from underserved communities across Nigeria.",
      entity: "PERSONAL",
      category: "Philosophy",
      source: "Public Interviews & Speeches",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Known for an authentic, accessible communication style that emphasizes resilience, hands-on hard work, African cultural pride, and practical mentorship.",
      entity: "PERSONAL",
      category: "Philosophy",
      source: "Brand Voice Analysis",
      confidence: "High",
      privacy: "Content-ready"
    },

    // --- ANIMATION HUB ---
    {
      fact: "Animation Hub is a premier Lagos-based animation studio and creative tech training academy founded by Adetunwase Adenle.",
      entity: "ANIMATION_HUB",
      category: "Company Overview",
      source: "Animation Hub Corporate Profile",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Animation Hub provides cutting-edge 2D and 3D animation services, visual effects, character design, and motion graphics for brands, broadcasters, and educational institutions.",
      entity: "ANIMATION_HUB",
      category: "Services",
      source: "Animation Hub Portfolio",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Runs an intensive Academy program training young African animators, bridging the digital skills gap and creating international freelance and production opportunities.",
      entity: "ANIMATION_HUB",
      category: "Initiative",
      source: "Animation Hub Academy Announcement",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Currently developing original African animated folklore and superhero IPs aimed at both continental and global streaming audiences.",
      entity: "ANIMATION_HUB",
      category: "Projects",
      source: "Animation Hub Internal Roadmap",
      confidence: "High",
      privacy: "Internal"
    },
    {
      fact: "Animation Hub is exploring strategic partnerships with pan-African streaming networks, edtech firms, and international animation festivals.",
      entity: "ANIMATION_HUB",
      category: "Partnerships",
      source: "Executive Strategy Meeting",
      confidence: "Medium",
      privacy: "Internal"
    },

    // --- ADETUNWASE ADENLE FOUNDATION ---
    {
      fact: "The Adetunwase Adenle Foundation is a non-profit organization dedicated to empowering disadvantaged youth and street children through arts education and creative vocational training.",
      entity: "FOUNDATION",
      category: "Foundation Mission",
      source: "Foundation Charter",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Has trained and impacted over 10,000 public school students across Lagos and southwest Nigeria with free art supplies, workshops, and mentorship.",
      entity: "FOUNDATION",
      category: "Impact Statistics",
      source: "Foundation Annual Report 2025",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Organizes the annual 'Creative Sparks' community art festival, providing a platform for young underprivileged talents to showcase their artwork to curators and philanthropists.",
      entity: "FOUNDATION",
      category: "Events",
      source: "Foundation Press Release",
      confidence: "High",
      privacy: "Public"
    },
    {
      fact: "Planning a pilot digital art laboratory in collaboration with local educational boards to introduce digital illustration tablets to rural classrooms.",
      entity: "FOUNDATION",
      category: "Future Plans",
      source: "Foundation Steering Committee",
      confidence: "Medium",
      privacy: "Internal"
    }
  ];

  for (const f of facts) {
    await prisma.knowledgeFact.create({ data: f });
  }

  // 3. Style Profile (Enforcing NO em dashes, direct human conversational tone)
  await prisma.styleProfile.upsert({
    where: { entity: "PERSONAL" },
    update: {},
    create: {
      entity: "PERSONAL",
      tone: "Direct, visionary, warm, conversational, punchy and grounded in Nigerian-African excellence.",
      prohibitedRules: "STRICT: Never use em dashes (—). Use commas, colons, or clean sentence breaks instead. Banned buzzwords: 'delve into', 'testament to', 'in today's rapidly evolving landscape', 'revolutionary paradigm', 'unlock unprecedented potential'. Avoid corporate PR jargon.",
      hookPatterns: JSON.stringify([
        "Most people thought this was impossible until we picked up the brush.",
        "Here is the real truth about building an animation studio in Lagos.",
        "I tell my students this every single Monday:",
        "Three years ago, nobody took African animation seriously. Here is what changed.",
        "A lesson I learned the hard way while breaking a world record:"
      ]),
      closingPatterns: JSON.stringify([
        "What do you think? Drop your thoughts below.",
        "The creative revolution is happening right here in Africa. Are you building with us?",
        "Never wait for permission to create something extraordinary.",
        "Let's discuss. How are you approaching this in your own space?"
      ]),
      learnedRulesJson: JSON.stringify([
        "Prefers shorter opening sentences.",
        "Likes using concrete numbers and names over abstract adjectives.",
        "Enjoys mentioning students and young creatives rather than generic 'youth'.",
        "Keeps calls-to-action conversational rather than transactional."
      ])
    }
  });

  // 4. Sample Social Posts with Performance Metrics
  const samplePosts = [
    {
      platform: "LINKEDIN",
      entity: "PERSONAL",
      topic: "The Discipline of World Records & Scaling Creative Talent",
      content: "When we painted 63 meters of canvas, the hardest part wasn't the paint. It was convincing 300 students that their hands were capable of world-class excellence.\n\nLeadership in the creative space is 90% belief transfer. When someone knows you believe in their craft, they step up.\n\nWe are applying that exact same standard at Animation Hub every day.",
      category: "Leadership",
      hashtags: "#Leadership #Creativity #AfricanTech #AnimationHub",
      likes: 842,
      comments: 64,
      shares: 38,
      views: 12400,
      engagementRate: 7.6,
      isHighPerformer: true
    },
    {
      platform: "X",
      entity: "PERSONAL",
      topic: "African Animation Pipeline",
      content: "We don't lack talent in Africa. We lack pipelines and distribution infrastructure. The moment we build sustainable pipelines, global screens will crave African stories.",
      category: "Creative Tech",
      hashtags: "#AnimationHub #AfricanStories",
      likes: 1240,
      comments: 112,
      shares: 450,
      views: 28900,
      engagementRate: 6.2,
      isHighPerformer: true
    },
    {
      platform: "INSTAGRAM",
      entity: "FOUNDATION",
      topic: "Weekend Workshop with 120 Kids in Makoko",
      content: "Look at these smiles. Over 120 young artists spent their Saturday learning color theory and storytelling with the Adetunwase Adenle Foundation.\n\nEvery child has genius inside them. All they need is an open door and a box of pastels.",
      category: "Youth",
      hashtags: "#AdetunwaseFoundation #ArtEducation #LagosKids #FutureLeaders",
      likes: 1890,
      comments: 94,
      shares: 110,
      views: 18500,
      engagementRate: 11.3,
      isHighPerformer: true
    },
    {
      platform: "LINKEDIN",
      entity: "ANIMATION_HUB",
      topic: "Why 3D Animation is the Next Big African Export",
      content: "Global streaming platforms spent over $14B on animated content last year. Less than 1% came from Africa. At Animation Hub, our mission is to change that math permanently.",
      category: "Animation",
      hashtags: "#AnimationHub #3DAnimation #AfricanCinema #CreativeEconomy",
      likes: 610,
      comments: 48,
      shares: 22,
      views: 8900,
      engagementRate: 7.6,
      isHighPerformer: false
    }
  ];

  for (const post of samplePosts) {
    await prisma.socialPost.create({ data: post });
  }

  // 5. Initial Trends in Trend Radar
  const trends = [
    {
      title: "Generative AI Integration in 2D/3D Animation Pipelines",
      category: "AI & Tech",
      summary: "Major animation houses are integrating AI tools for in-betweening and background layout, raising debates on artistic authenticity and production speed.",
      relevanceAdetun: 95,
      relevanceAnimationHub: 98,
      relevanceFoundation: 70,
      timelinessScore: 94,
      brandFitScore: 92,
      anglesJson: JSON.stringify([
        "Animation Hub angle: Why human character emotion and cultural nuance can never be replaced by algorithms.",
        "Industry perspective: How African studios can use AI for rapid background rendering while preserving pure handmade character soul.",
        "Educational angle: How we are teaching next-gen animators at Animation Hub to direct AI rather than fear it."
      ]),
      source: "Variety / Cartoon Brew",
      sourceUrl: "https://www.cartoonbrew.com"
    },
    {
      title: "Global Demand for Authentic African Indigenous Folktales & Animation IPs",
      category: "Creative Industry",
      summary: "Streaming giants like Netflix, Disney+, and local platforms are actively commissioning African-originated stories, highlighting a lack of scaled studios on the continent.",
      relevanceAdetun: 98,
      relevanceAnimationHub: 96,
      relevanceFoundation: 85,
      timelinessScore: 92,
      brandFitScore: 97,
      anglesJson: JSON.stringify([
        "Thought leadership: Africa should own its intellectual property, not just serve as cheap outsourced labor for Western studios.",
        "Personal journey: How breaking Guinness World Records taught Adetunwase that monumental African stories command global respect.",
        "Foundation tie-in: Inspiring the next generation of storytellers starting right in elementary school classrooms."
      ]),
      source: "Screen Daily Africa",
      sourceUrl: "https://www.screendaily.com"
    },
    {
      title: "Creative Arts and STEM Integration in African Primary Education",
      category: "Youth & Education",
      summary: "New policy dialogues across Nigeria and UNESCO pushing for STEAM (adding Arts to STEM) to foster critical problem solving in children.",
      relevanceAdetun: 90,
      relevanceAnimationHub: 75,
      relevanceFoundation: 99,
      timelinessScore: 88,
      brandFitScore: 95,
      anglesJson: JSON.stringify([
        "Foundation advocacy: Why drawing and visual thinking is fundamental cognitive training, not just a hobby.",
        "Policy challenge: An open message to educational leaders on funding creative supplies in public schools.",
        "Case study: What we saw when 10,000 public school students participated in Foundation creative workshops."
      ]),
      source: "UNESCO Education Report",
      sourceUrl: "https://unesco.org"
    }
  ];

  for (const t of trends) {
    await prisma.trend.create({ data: t });
  }

  // 6. Sample Contacts for Professional Research
  const contacts = [
    {
      name: "Folake Ani-Mumuney",
      role: "Global Head of Marketing & Communications",
      company: "FBN Holdings",
      email: "folake.ani-mumuney@firstbanknigeria.com",
      emailType: "Public Directory",
      phone: "+234 1 905 2000",
      linkedin: "https://linkedin.com/in/folake-ani-mumuney",
      website: "https://www.firstbanknigeria.com",
      source: "Official Corporate Press Release & Leadership Directory",
      confidence: "High",
      isVerified: true,
      notes: "Champion of African creative arts and cultural heritage sponsorships."
    },
    {
      name: "Tosin Oshinowo",
      role: "Principal Architect & Cultural Curator",
      company: "Oshinowo Studio",
      email: "info@oshinowostudio.com",
      emailType: "Official",
      linkedin: "https://linkedin.com/in/tosin-oshinowo",
      website: "https://oshinowostudio.com",
      source: "Official Studio Website Contact",
      confidence: "High",
      isVerified: true,
      notes: "International curator; strong advocate for African public art and architecture."
    }
  ];

  for (const c of contacts) {
    await prisma.contact.create({ data: c });
  }

  // 7. Today's Daily Briefing
  await prisma.dailyBriefing.create({
    data: {
      date: new Date().toISOString().split("T")[0],
      executiveHeadline: "African creative IP surges in global streaming demand; 2 high-leverage partnership opportunities identified for Animation Hub.",
      threeKeyNewsJson: JSON.stringify([
        "Global animation markets reported a 22% increase in acquisitions of non-Western animated series.",
        "Lagos State Ministry of Innovation announced new creative tech incubation grants open for application.",
        "UNESCO issued new recommendations emphasizing Arts & Digital Media training in African primary curricula."
      ]),
      twoRelevantTrendsJson: JSON.stringify([
        "GenAI in animation: Opportunity to position Animation Hub as a studio marrying traditional handcraft with cutting-edge tech.",
        "STEAM education push: Directly reinforces the Adetunwase Adenle Foundation's upcoming 2026 digital arts initiative."
      ]),
      oneContentOppJson: JSON.stringify({
        platform: "LinkedIn",
        hook: "Most people think animation studios just need computers. They actually need storytellers.",
        angle: "Reflect on how Animation Hub trains raw creative talent into world-class animators.",
        estimatedEngagement: "High"
      }),
      recommendedDraftsJson: JSON.stringify([
        {
          platform: "LINKEDIN",
          topic: "Building the African Animation Pipeline",
          status: "Draft",
          content: "Last week a European producer asked me why we are training young Nigerian animators from scratch instead of just hiring experienced overseas freelancers.\n\nMy answer was simple: You cannot tell authentic African stories with borrowed lenses.\n\nWhen we founded Animation Hub, our goal was never just to be a service provider. Our goal was to create an engine where young people from Lagos, Ibadan, and Abuja can see their own folklore on global screens.\n\nTalent is universal. Opportunity is what we are building here every single day."
        },
        {
          platform: "X",
          topic: "Art, Discipline and World Records",
          status: "Draft",
          content: "Breaking a Guinness World Record taught me one thing that tech founders often forget:\n\nBig dreams look ridiculous until they are finished. Keep painting your canvas."
        }
      ]),
      meetingsOverview: "Review briefing for tomorrow's exploration call with Pan-African creative fund partners."
    }
  });

  // 8. Initial Content Studio Drafts
  const initialDrafts = [
    {
      platform: "LINKEDIN",
      entity: "PERSONAL",
      topic: "The Hard Truth About Building an African Animation Pipeline",
      hook: "Most people think animation studios just need computers. They actually need storytellers.",
      content: "Last week a European producer asked me why we are training young Nigerian animators from scratch instead of just hiring experienced overseas freelancers.\n\nMy answer was simple: You cannot tell authentic African stories with borrowed lenses.\n\nWhen we founded Animation Hub, our goal was never just to be a service provider. Our goal was to create an engine where young people from Lagos, Ibadan, and Abuja can see their own folklore on global screens.\n\nTalent is universal. Opportunity is what we are building here every single day.",
      visualSuggestion: "Behind-the-scenes photograph of Academy students sketching character turnarounds.",
      cta: "How is your organization investing in grassroots African talent? Let's discuss in the comments.",
      hashtags: "#AfricanAnimation #AnimationHub #CreativeEconomy #AdetunwaseAdenle",
      status: "Approved"
    },
    {
      platform: "X",
      entity: "ANIMATION_HUB",
      topic: "Art, Discipline, and Guinness World Records",
      hook: "Big dreams look ridiculous until they are finished.",
      content: "Breaking a Guinness World Record taught me one thing that tech founders often forget:\n\nBig dreams look ridiculous until they are finished. Keep painting your canvas.",
      visualSuggestion: "High-angle drone shot of the record-breaking 63-meter painting in Lagos.",
      cta: "Keep building.",
      hashtags: "#AnimationHub #AfricanExcellence #GuinnessWorldRecord",
      status: "Draft"
    },
    {
      platform: "INSTAGRAM",
      entity: "FOUNDATION",
      topic: "Weekend Creative Sparks Workshop in Makoko",
      hook: "120 kids. 120 boxes of pastels. Infinite imagination.",
      content: "Look at these smiles. Over 120 young artists spent their Saturday learning color theory and storytelling with the Adetunwase Adenle Foundation.\n\nEvery child has genius inside them. All they need is an open door and someone who believes in their hands.\n\nThank you to our volunteer mentors for making this possible.",
      visualSuggestion: "Carousel: Slide 1 - Wide shot of students drawing; Slide 2 - Close-up on finished artwork; Slide 3 - Group portrait smiling.",
      cta: "Drop a ❤️ to support our young artists.",
      hashtags: "#AdetunwaseFoundation #ArtEducation #LagosYouth #CreativeSparks",
      status: "Scheduled"
    },
    {
      platform: "FACEBOOK",
      entity: "PERSONAL",
      topic: "Reflecting on 10,000 Students Reached",
      hook: "A quick reflection on where this journey started.",
      content: "When we started teaching public school kids on open fields years ago, we had no idea this mission would cross 10,000 young lives.\n\nArt is not an extracurricular luxury. In Nigeria, art is cognitive training. It teaches a young person to look at a blank canvas and realize that they have the power to create whatever the future needs.\n\nTo everyone who has supported the Foundation and Animation Hub along this road, thank you for standing with us.",
      visualSuggestion: "Warm candid photo of Adetunwase mentoring a young student.",
      cta: "Share this if you believe in the creative potential of every African child.",
      hashtags: "#EducationForAll #ArtAndTechnology #CommunityFirst #Nigeria",
      status: "Published"
    }
  ];

  for (const draft of initialDrafts) {
    await prisma.contentDraft.create({ data: draft });
  }

  // 9. Chief of Staff: Projects
  const project1 = await prisma.project.create({
    data: {
      name: "3D Animation Pilot: Legends of the Coast",
      entity: "ANIMATION_HUB",
      objective: "Produce a broadcast-ready 12-minute 3D animation pilot demonstrating high-end African folklore storytelling.",
      expectedOutcome: "A festival-grade teaser and pilot episode ready for global streaming licensing pitches.",
      status: "ACTIVE",
      healthScore: 84,
      healthReason: "On track overall, but audio scoring dependency requires attention before final render.",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // in 14 days
      predictedCompletionDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 2 days risk buffer
      milestonesJson: JSON.stringify([
        { title: "Storyboards & Concept Art", targetDate: "2026-08-15", completed: true },
        { title: "3D Character Modeling & Rigging", targetDate: "2026-09-01", completed: true },
        { title: "Rough Animation Pass", targetDate: "2026-09-15", completed: false },
        { title: "Lighting, Texturing & Final Render", targetDate: "2026-09-25", completed: false }
      ]),
      risksJson: JSON.stringify([
        { risk: "GPU render farm memory bottlenecks", severity: "High", probability: "Medium", mitigation: "Enable distributed batch rendering across studio workstations overnight." },
        { risk: "Voiceover audio mastering delays", severity: "Medium", probability: "Low", mitigation: "Book secondary recording studio in Ikeja as backup." }
      ]),
      decisionsJson: JSON.stringify([
        { decision: "Adopt hybrid 2D cel-shaded style on 3D models for authentic hand-drawn feel.", date: "2026-08-20", reason: "Distinguishes the IP from generic CGI." }
      ]),
      budget: "₦18,500,000",
      communicationPlan: "Weekly sprint review every Monday at 10 AM; daily standup via Slack.",
      successMetrics: "Viewer retention > 80% in test screenings; minimum 2 streaming acquisition meetings."
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Creative Sparks 2026 Tour: 10 Schools in Lagos",
      entity: "FOUNDATION",
      objective: "Equip and train 2,500 public elementary and secondary school students with professional art and digital storytelling workshops.",
      expectedOutcome: "Student exhibition at Lagos State Arts Council and 50 secondary school scholarship awards.",
      status: "ACTIVE",
      healthScore: 92,
      healthReason: "Strong volunteer turnout and corporate art supply donations fully secured.",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      predictedCompletionDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      milestonesJson: JSON.stringify([
        { title: "Curriculum & Supply Procurement", targetDate: "2026-08-30", completed: true },
        { title: "School Board Approvals & Logistics", targetDate: "2026-09-10", completed: true },
        { title: "Phase 1 School Workshops (Schools 1-5)", targetDate: "2026-09-20", completed: false },
        { title: "Final Student Exhibition & Gala", targetDate: "2026-10-10", completed: false }
      ]),
      budget: "₦7,200,000",
      successMetrics: "2,500 students reached, 10 partner schools, 100 featured student artworks."
    }
  });

  // 10. Chief of Staff: Operational Tasks
  const tasks = [
    {
      title: "Review rough-cut animation reel for Episode 1",
      description: "Inspect character expressions and lighting nuances in scenes 4 and 7 before composer scoring.",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      entity: "ANIMATION_HUB",
      projectName: "3D Animation Pilot: Legends of the Coast",
      projectId: project1.id,
      personResponsible: "Adetunwase Adenle",
      notes: "Lead animator has uploaded the latest cut to frame.io."
    },
    {
      title: "Follow up with John Doe on streaming co-production agreement",
      description: "Check if the international licensing and intellectual property clauses have been approved by their legal team.",
      priority: "HIGH",
      status: "WAITING",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      entity: "ANIMATION_HUB",
      projectName: "3D Animation Pilot: Legends of the Coast",
      projectId: project1.id,
      personResponsible: "Adetunwase Adenle",
      notes: "Waiting on John's legal team to send redlines."
    },
    {
      title: "Procure 500 pastel kits & sketchpads for Makoko workshop",
      description: "Confirm delivery receipt from art distributor and verify supplies against warehouse packing list.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      entity: "FOUNDATION",
      projectName: "Creative Sparks 2026 Tour: 10 Schools in Lagos",
      projectId: project2.id,
      personResponsible: "Foundation Logistics Lead",
      notes: "₦450,000 disbursement approved."
    },
    {
      title: "Resolve GPU render cluster driver conflict on Node 3",
      description: "Blender Cycles rendering crashes on heavy particle simulation scenes.",
      priority: "CRITICAL",
      status: "BLOCKED",
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      entity: "ANIMATION_HUB",
      projectName: "3D Animation Pilot: Legends of the Coast",
      projectId: project1.id,
      personResponsible: "Technical Director",
      notes: "Awaiting NVIDIA studio driver rollback."
    },
    {
      title: "Finalize keynote presentation for African Creative Economy Summit",
      description: "Highlight Guinness World Record lessons and how creative tech builds non-oil export value.",
      priority: "MEDIUM",
      status: "PLANNED",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      entity: "PERSONAL",
      personResponsible: "Adetunwase Adenle"
    },
    {
      title: "Send sponsorship impact summary to FirstBank CSR leadership",
      description: "Thank-you note and photo gallery showcasing 120 students from last weekend's workshop.",
      priority: "LOW",
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      entity: "FOUNDATION",
      personResponsible: "Adetunwase Adenle"
    }
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }

  // 11. Chief of Staff: Smart Reminders
  const reminders = [
    {
      title: "Review Animation Hub rough cut before sound sync meeting",
      triggerAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // in 4 hours
      type: "RELATIVE",
      priority: "CRITICAL",
      status: "PENDING",
      escalationLevel: 1
    },
    {
      title: "Follow up with John Doe if streaming draft is not received by 3 PM",
      triggerAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      type: "FOLLOW_UP",
      priority: "HIGH",
      status: "PENDING",
      escalationLevel: 2
    },
    {
      title: "Foundation supply dispatch check for Makoko schools",
      triggerAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      type: "DEADLINE",
      priority: "HIGH",
      status: "PENDING",
      escalationLevel: 1
    }
  ];

  for (const r of reminders) {
    await prisma.reminder.create({ data: r });
  }

  // 12. AI Action Center Queue
  const actionItems = [
    {
      title: "Send Animation Co-Production Teaser to Netflix Africa Executive",
      description: "Proposal deck and 60-second teaser ready for delivery with verified work email.",
      type: "SEND_EMAIL",
      status: "NEEDS_APPROVAL",
      riskLevel: "HIGH",
      payloadJson: JSON.stringify({ recipient: "john.doe@netflix.com", subject: "Animation Hub: Legends of the Coast Co-Production" })
    },
    {
      title: "Publish LinkedIn thought leadership post on African Creative Pipelines",
      description: "Approved draft scheduled for 9:00 AM audience peak.",
      type: "PUBLISH_POST",
      status: "NEEDS_APPROVAL",
      riskLevel: "MEDIUM",
      payloadJson: JSON.stringify({ platform: "LINKEDIN", topic: "African Animation Pipelines" })
    },
    {
      title: "Automated morning operations briefing synthesized",
      description: "Prioritized 3 urgent operational bottlenecks and verified pending deliverables.",
      type: "UPDATE_STATUS",
      status: "AUTO_COMPLETED",
      riskLevel: "LOW",
      executedAt: new Date()
    },
    {
      title: "Waiting on streaming contract redlines from counterparty legal counsel",
      description: "John Doe indicated contract was with internal legal team; expected by Thursday.",
      type: "WAITING_ITEM",
      status: "WAITING",
      riskLevel: "LOW",
      waitingOn: "John Doe / Legal Team"
    }
  ];

  for (const a of actionItems) {
    await prisma.actionItem.create({ data: a });
  }

  // 13. High-Leverage Strategic Opportunities
  const opportunities = [
    {
      title: "Lagos State Creative Tech & Innovation Grant (₦25M)",
      entity: "ANIMATION_HUB",
      type: "GRANT",
      whyItMatters: "Direct grant funding to subsidize 100 additional youth animation academy seats.",
      potentialValue: "₦25,000,000",
      relevanceAdetun: 96,
      recommendedAction: "Submit Animation Hub academy curriculum and student placement metrics before cutoff.",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      contactName: "Ministry of Innovation & Technology Grant Committee",
      contactInfo: "grants@lagosstate.gov.ng",
      source: "Lagos State Official Gazette",
      status: "PURSUING"
    },
    {
      title: "Pan-African Animation Co-Production Fund & Distribution Deal",
      entity: "ANIMATION_HUB",
      type: "PARTNERSHIP",
      whyItMatters: "Guaranteed multi-territory streaming distribution across Sub-Saharan Africa and diaspora.",
      potentialValue: "$120,000 - $180,000",
      relevanceAdetun: 98,
      recommendedAction: "Deliver 12-minute pilot episode cut and character Bible.",
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      contactName: "John Doe (VP Content Acquisition)",
      source: "Direct Executive Pitch Meeting",
      status: "PURSUING"
    },
    {
      title: "UNESCO Global STEAM Keynote: Art as an Economic Driver",
      entity: "PERSONAL",
      type: "SPEAKING",
      whyItMatters: "Global thought leadership platform cementing Adetunwase's position as Africa's premier creative arts educator.",
      potentialValue: "High Brand Equity / International Sponsorships",
      relevanceAdetun: 95,
      recommendedAction: "Confirm keynote availability and submit abstract on Guinness World Records & youth cognitive training.",
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      contactName: "UNESCO Education Bureau, Paris",
      source: "Official Invitation Letter",
      status: "NEW"
    }
  ];

  for (const o of opportunities) {
    await prisma.opportunity.create({ data: o });
  }

  // 14. Relationships & Autonomous Follow-Up Tracker
  const followUps = [
    {
      personName: "John Doe",
      company: "Streaming Network",
      role: "VP Content Acquisition",
      lastInteractionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      commitmentsByAdetun: "Send episode 1 rough cut and budget breakdown by Friday.",
      commitmentsByThem: "Send standard co-production agreement template and term sheet.",
      waitingOnThem: true,
      status: "PENDING",
      notes: "Expressed great excitement about the indigenous Yoruba mythology theme."
    },
    {
      personName: "Folake Ani-Mumuney",
      company: "FBN Holdings",
      role: "Global Head of Marketing & Communications",
      lastInteractionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      commitmentsByAdetun: "Share Creative Sparks 2026 student enrollment numbers for sponsorship consideration.",
      commitmentsByThem: "Introduce Adetunwase to the CSR Foundation grant committee.",
      waitingOnThem: false,
      status: "PENDING",
      notes: "Strong champion of African public art and children's education."
    }
  ];

  for (const f of followUps) {
    await prisma.relationshipFollowUp.create({ data: f });
  }

  // 15. Decision Room Record
  await prisma.decisionRecord.create({
    data: {
      topic: "In-House Dedicated GPU Render Cluster vs Cloud Rendering (AWS Thinkbox Deadline)",
      optionA: "Invest ₦6.5M in four in-house RTX workstations dedicated to batch rendering.",
      optionB: "Use on-demand cloud rendering bursts (AWS/GCP) billed per compute minute.",
      criteriaJson: JSON.stringify({
        cost: "In-house has high upfront CapEx but zero recurring fees; cloud has low upfront but unpredictable OpEx and bandwidth costs.",
        time: "In-house avoids uploading multi-gigabyte heavy Alembic and VDB cache files over local internet.",
        risk: "Cloud depends heavily on Lagos fiber internet uptime and FX dollar fluctuation.",
        strategicAlignment: "In-house infrastructure directly benefits Academy students for live local training.",
        complexity: "In-house requires local UPS power and thermal management."
      }),
      recommendation: "Choose Option A (In-House Dedicated Cluster) with a micro-cloud bursting account as secondary emergency backup.",
      rationale: "Given local internet bandwidth constraints for massive 3D cache files and foreign exchange volatility, in-house render hardware pays for itself within 7 months and doubles as workstation hardware for Academy trainees.",
      status: "DECIDED",
      entity: "ANIMATION_HUB"
    }
  });

  // 16. Strategic 12-Month Roadmap
  await prisma.strategicRoadmap.create({
    data: {
      entity: "ANIMATION_HUB",
      title: "Animation Hub 12-Month Scale & IP Commercialization Roadmap",
      objective: "Transition Animation Hub from a high-touch service studio to a globally recognized African IP studio with recurring academy and licensing revenue.",
      currentState: "15 full-time animators, 40 Academy students per cohort, 1 pilot in production, commercial client work generating steady cash flow.",
      roadmap12MonthJson: JSON.stringify([
        { phase: "Q1: Pipeline Hardening & Pilot Delivery", focus: "Finish Legends of the Coast pilot; establish distributed render cluster." },
        { phase: "Q2: Global Licensing & Festival Circuit", focus: "Screen pilot at Annecy & MIFA; sign co-production distribution deal." },
        { phase: "Q3: Academy Scale & Corporate Partnerships", focus: "Double academy intake to 100 students; launch corporate animation masterclasses." },
        { phase: "Q4: Series Greenlight & Merchandise Pilot", focus: "Commence production on full 6-episode season; launch comic companion." }
      ]),
      quarterlyGoalsJson: JSON.stringify([
        "Q1: Complete 12-minute 3D animation pilot under budget.",
        "Q2: Secure minimum $150K in co-production commitments.",
        "Q3: Achieve 90% placement rate for Animation Hub Academy graduates.",
        "Q4: Reach ₦80M annual revenue run-rate across services and licensing."
      ]),
      monthlyMilestonesJson: JSON.stringify([
        "Month 1: Sound design and color grading on Pilot Ep 1.",
        "Month 2: Closed screening with 50 test viewers; polish rough edges.",
        "Month 3: Submission package to Annecy International Animation Festival."
      ]),
      keyMetricsJson: JSON.stringify([
        "Production velocity: 90 seconds of finished animation per week.",
        "Academy enrollment: 100 certified young animators/year.",
        "Gross margin on commercial projects: > 45%."
      ]),
      requiredResourcesJson: "4 dedicated GPU render rigs, 1 pipeline technical director, ₦12M working capital buffer.",
      next7DaysJson: JSON.stringify([
        "Resolve GPU cluster driver bottleneck on Node 3.",
        "Review episode 1 rough cut with lead director.",
        "Follow up with John Doe on licensing terms."
      ])
    }
  });

  console.log("Chief of Staff & Operations data seeded successfully!");

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
