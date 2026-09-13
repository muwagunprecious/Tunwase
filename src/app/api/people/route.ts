import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  investigatePerson,
  generateMeetingBrief,
  generateOutreachDraft,
  findLegitimateContact,
  PersonProfile
} from "@/lib/agents/people-search";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const dossier = await prisma.researchDossier.findUnique({
        where: { id }
      });
      if (!dossier) {
        return NextResponse.json({ error: "Dossier not found" }, { status: 404 });
      }
      const profile = JSON.parse(dossier.overviewJson);
      return NextResponse.json({ profile, dossierId: dossier.id });
    }

    // Return recent research history
    const recent = await prisma.researchDossier.findMany({
      where: { targetType: "PERSON" },
      orderBy: { createdAt: "desc" },
      take: 15
    });

    const history = recent.map((d) => ({
      id: d.id,
      query: d.query,
      targetName: d.targetName,
      roleOrIndustry: d.roleOrIndustry,
      company: d.company,
      createdAt: d.createdAt
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("People API GET error:", error);
    return NextResponse.json({ error: "Failed to fetch people history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "search", query, candidate, profile, objective } = body;

    // 1. Initial Name Search with Disambiguation Check
    if (action === "search") {
      if (!query || typeof query !== "string" || !query.trim()) {
        return NextResponse.json({ error: "Name or query is required" }, { status: 400 });
      }

      const result = await investigatePerson(query.trim(), { deep: body.deep || false });

      // If single match found, persist to research dossier history
      if (result.status === "SINGLE_MATCH" && result.profile) {
        await persistDossier(query.trim(), result.profile);
      }

      return NextResponse.json(result);
    }

    // 2. Resolve Disambiguation Selection
    if (action === "resolve") {
      if (!candidate) {
        return NextResponse.json({ error: "Candidate is required for resolution" }, { status: 400 });
      }

      const result = await investigatePerson(candidate.name, {
        forcedPerson: candidate,
        deep: body.deep || false
      });

      if (result.profile) {
        await persistDossier(candidate.name, result.profile);
      }

      return NextResponse.json(result);
    }

    // 3. Deeper Research Pass
    if (action === "deep_search") {
      if (!query && !profile) {
        return NextResponse.json({ error: "Target name or profile is required" }, { status: 400 });
      }

      const target = query || profile.personalInfo.name;
      const result = await investigatePerson(target, {
        deep: true,
        forcedPerson: profile ? {
          id: profile.id,
          name: profile.personalInfo.name,
          role: profile.personalInfo.currentRole,
          company: profile.personalInfo.company,
          location: profile.personalInfo.countryRegion,
          industry: profile.personalInfo.industry,
          snippet: profile.personalInfo.bio,
          confidence: "High"
        } : undefined
      });

      if (result.profile) {
        await persistDossier(target, result.profile);
      }

      return NextResponse.json(result);
    }

    // 4. Dedicated Professional Contact Investigation
    if (action === "find_contact") {
      if (!profile) {
        return NextResponse.json({ error: "Profile is required to find contact" }, { status: 400 });
      }

      const updated = await findLegitimateContact(profile);
      const updatedProfile = {
        ...profile,
        contactInfo: updated.contactInfo,
        sources: updated.sources
      };
      await persistDossier(profile.personalInfo.name, updatedProfile);
      return NextResponse.json({ profile: updatedProfile });
    }

    // 5. Generate Meeting Preparation Brief
    if (action === "meeting_brief") {
      if (!profile) {
        return NextResponse.json({ error: "Profile is required to generate meeting brief" }, { status: 400 });
      }

      const brief = await generateMeetingBrief(profile);
      return NextResponse.json({ brief });
    }

    // 5. Generate Outreach Draft (Email + LinkedIn)
    if (action === "draft_outreach") {
      if (!profile) {
        return NextResponse.json({ error: "Profile is required to draft outreach" }, { status: 400 });
      }

      const outreach = await generateOutreachDraft(profile, objective);
      return NextResponse.json({ outreach });
    }

    // 6. Save to Contacts & Relationship CRM
    if (action === "save_contact") {
      if (!profile) {
        return NextResponse.json({ error: "Profile is required to save contact" }, { status: 400 });
      }

      const pInfo = profile.personalInfo;
      const cInfo = profile.contactInfo;
      const primaryEmail = cInfo.emails?.[0];
      const primaryPhone = cInfo.phones?.[0];
      const linkedin = profile.socialMedia?.find((s: any) => s.platform === "LinkedIn")?.url;

      const contact = await prisma.contact.create({
        data: {
          name: pInfo.name,
          role: pInfo.currentRole,
          company: pInfo.company,
          email: primaryEmail?.email || null,
          emailType: primaryEmail?.isPattern ? "Inferred Pattern" : (primaryEmail?.type || "Official"),
          phone: primaryPhone?.number || null,
          linkedin: linkedin || null,
          website: cInfo.companyWebsite || null,
          source: primaryEmail?.source || "People Search Agent",
          confidence: primaryEmail?.confidence || "Medium",
          isVerified: !primaryEmail?.isPattern && primaryEmail?.confidence === "High",
          notes: `${pInfo.bio.slice(0, 300)}... | Synergy: ${profile.whyMattersToAdetun}`
        }
      });

      // Also create a relationship tracking record if it doesn't already exist
      await prisma.relationshipFollowUp.create({
        data: {
          personName: pInfo.name,
          company: pInfo.company,
          role: pInfo.currentRole,
          lastInteractionDate: new Date(),
          commitmentsByAdetun: `Connect regarding Animation Hub / Foundation synergy`,
          commitmentsByThem: null,
          waitingOnThem: false,
          notes: `Researched via People Search Agent. ${profile.whyMattersToAdetun}`
        }
      });

      return NextResponse.json({ contact, saved: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("People API POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to process people research" }, { status: 500 });
  }
}

async function persistDossier(query: string, profile: PersonProfile) {
  try {
    await prisma.researchDossier.create({
      data: {
        query,
        targetType: "PERSON",
        targetName: profile.personalInfo.name,
        roleOrIndustry: profile.personalInfo.currentRole,
        company: profile.personalInfo.company,
        summary: profile.personalInfo.bio.slice(0, 500),
        overviewJson: JSON.stringify(profile),
        whyItMatters: profile.whyMattersToAdetun,
        confidence: profile.contactInfo.emails?.[0]?.confidence || "High",
        sourcesJson: JSON.stringify(profile.sources)
      }
    });
  } catch (e) {
    console.warn("Could not persist research dossier:", e);
  }
}
