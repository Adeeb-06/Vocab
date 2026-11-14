
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

    const wordLists = await prisma.wordList.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            items: true,
            lessons: true,
          },
        },
      },
    });

    return NextResponse.json({
      wordLists: wordLists.map((list) => ({
        id: list.id,
        title: list.title,
        slug: list.slug,
        description: list.description,
        wordCount: list._count.items,
        lessonCount: list._count.lessons,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch word lists error:", error);

    return NextResponse.json(
      { message: "Could not load word lists." },
      { status: 500 }
    );
  }
}
