import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addReferencePost } from "@/lib/social/reference-writer-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const writerId = searchParams.get("writerId");

    const posts = await prisma.referencePost.findMany({
      where: writerId ? { writerId } : undefined,
      orderBy: { collectedAt: "desc" },
      take: 50,
      include: { writer: { select: { name: true, linkedinUrl: true } } }
    });

    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error("Failed to list reference posts:", err);
    return NextResponse.json({ error: "Failed to list reference posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { writerId, postText, postUrl, topic, publishedAt, sourceType } = body;

    if (!writerId || !postText) {
      return NextResponse.json({ error: "writerId and postText are required" }, { status: 400 });
    }

    const post = await addReferencePost({
      writerId,
      postText,
      postUrl,
      topic,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      sourceType
    });

    return NextResponse.json({ post });
  } catch (err: any) {
    console.error("Failed to add reference post:", err);
    return NextResponse.json({ error: "Failed to add reference post" }, { status: 500 });
  }
}
