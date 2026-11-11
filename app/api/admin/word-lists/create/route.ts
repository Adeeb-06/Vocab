
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    const { title, description, wordIds } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100 ||
      !Array.isArray(wordIds) ||
      wordIds.length === 0 ||
      wordIds.length > 2000 ||
      !wordIds.every(
        (id: unknown) =>
          typeof id === "string" && /^[a-f\d]{24}$/i.test(id)
      )
    ) {
      return NextResponse.json(
        { message: "Please provide a valid title and word selection." },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > 500)
    ) {
      return NextResponse.json(
        { message: "Description must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    if (new Set(wordIds).size !== wordIds.length) {
      return NextResponse.json(
        { message: "Duplicate words are not allowed." },
        { status: 400 }
      );
    }

    const slug = title
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return NextResponse.json(
        { message: "Please provide a title that can create a valid slug." },
        { status: 400 }
      );
    }

    // Verify every selected word is active and verified.
    const verifiedCount = await prisma.word.count({
      where: {
        id: { in: wordIds },
        isVerified: true,
        isActive: true,
      },
    });

    if (verifiedCount !== wordIds.length) {
      return NextResponse.json(
        {
          message:
            "Some selected words are no longer verified or active. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    const wordList = await prisma.wordList.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        items: {
          create: wordIds.map((wordId: string, index: number) => ({
            word: {
              connect: { id: wordId },
            },
            order: index + 1,
            isFree: true,
          })),
        },
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Word list created successfully.",
        wordList: {
          id: wordList.id,
          title: wordList.title,
          slug: wordList.slug,
          description: wordList.description,
          wordCount: wordList._count.items,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create word list error:", error);

    const prismaError = error as { code?: string };

    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { message: "A word list with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create word list." },
      { status: 500 }
    );
  }
}
