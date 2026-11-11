
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const wordLists = await prisma.wordList.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        lessons: {
          orderBy: {
            lessonNumber: "desc",
          },
          take: 1,
          select: {
            lessonNumber: true,
          },
        },
      },
    });

    const formattedWordLists = wordLists.map((list) => ({
      id: list.id,
      title: list.title,
      nextLessonNumber:
        (list.lessons[0]?.lessonNumber ?? 0) + 1,
    }));

    return NextResponse.json({
      wordLists: formattedWordLists,
    });
  } catch (error) {
    console.error("Fetch lesson options error:", error);

    return NextResponse.json(
      { message: "Failed to fetch word lists." },
      { status: 500 }
    );
  }
}
