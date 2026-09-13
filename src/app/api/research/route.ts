import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { researchProfessionalContact } from "@/lib/agents/contact-research";
import { polishHumanContent } from "@/lib/agents/content-cleaner";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (query) {
      const existing = await prisma.researchDossier.findMany({
        where: {
          OR: [
            { targetName: { contains: query } },
            { query: { contains: query } },
            { company: { contains: query } }
          ]
        },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ dossiers: existing });
    }

    const dossiers = await prisma.researchDossier.findMany({
      take: 20,
      orderBy: { createdAt: "desc" }
    });

    const contacts = await prisma.contact.findMany({
      take: 20,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ dossiers, contacts });
  } catch (error: any) {
    console.error("Research fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch research" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { targetName, companyName, targetType } = await req.json();

    if (!targetName) {
      return NextResponse.json({ error: "Target name is required" }, { status: 400 });
    }

    const dossier = await researchProfessionalContact(targetName, companyName);

    // Save contact if generated
    if (dossier.contactDetails) {
      await prisma.contact.create({
        data: {
          name: dossier.contactDetails.name,
          role: dossier.contactDetails.role,
          company: dossier.contactDetails.company,
          email: dossier.contactDetails.workEmail,
          emailType: dossier.contactDetails.emailType,
          phone: dossier.contactDetails.businessPhone,
          linkedin: dossier.contactDetails.linkedinUrl,
          website: dossier.contactDetails.companyWebsite,
          source: dossier.contactDetails.source,
          confidence: dossier.contactDetails.confidence,
          isVerified: dossier.contactDetails.emailType === "Verified Official",
          notes: dossier.contactDetails.relevanceToAdetun
        }
      });
    }

    const savedDossier = await prisma.researchDossier.create({
      data: {
        query: `${targetName} ${companyName || ""}`.trim(),
        targetType: targetType || "PERSON",
        targetName,
        roleOrIndustry: dossier.role,
        company: dossier.company,
        summary: polishHumanContent(dossier.professionalBackground).polished,
        overviewJson: JSON.stringify({
          achievements: dossier.publicAchievements,
          recentNews: dossier.recentNews,
          meetingPrep: dossier.meetingPrepAngle
        }),
        whyItMatters: polishHumanContent(dossier.whyThisPersonMatters).polished,
        confidence: dossier.contactDetails.confidence,
        sourcesJson: JSON.stringify(dossier.sources)
      }
    });

    return NextResponse.json({ dossier: savedDossier, contact: dossier.contactDetails });
  } catch (error: any) {
    console.error("Execute research error:", error);
    return NextResponse.json({ error: "Failed to conduct research" }, { status: 500 });
  }
}
