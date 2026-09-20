import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const pillar = searchParams.get("pillar");
    const contentType = searchParams.get("type");
    const priority = searchParams.get("priority");
    const search = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (pillar && pillar !== "ALL") where.contentPillar = pillar;
    if (contentType && contentType !== "ALL") where.contentType = contentType;
    if (priority && priority !== "ALL") where.priority = priority;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { caption: { contains: search, mode: "insensitive" } },
        { topic: { contains: search, mode: "insensitive" } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.captionBankItem.count({ where }),
      prisma.captionBankItem.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        include: {
          context: { select: { event: true, location: true, topic: true } },
          _count: { select: { edits: true } }
        }
      })
    ]);

    // Backlog status count
    const activeBacklogCount = await prisma.captionBankItem.count({
      where: { status: { in: ["ready_for_review", "approved", "scheduled"] } }
    });

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      activeBacklogCount
    });
  } catch (err: any) {
    console.error("Failed to list caption bank items:", err);
    return NextResponse.json({ error: "Failed to list caption bank items" }, { status: 500 });
  }
}
