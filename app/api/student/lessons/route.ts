import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(request, "user");

  if (!auth.ok) return auth.response;

  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: [
        { wordListId: "asc" },
        { lessonNumber: "asc" },
      ],
      select: {
        id: true,
        wordListId: true,
        title: true,
        description: true,
        lessonNumber: true,

        wordList: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
        },

        _count: {
          select: {
            items: true,
          },
        },

        progress: {
          where: {
            userId: auth.user.id,
          },
          select: {
            status: true,
            score: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    const grouped = new Map<
      string,
      {
        wordList: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
        };
        lessons: any[];
      }
    >();

    for (const lesson of lessons) {
      const progress = lesson.progress[0] ?? null;

      if (!grouped.has(lesson.wordListId)) {
        grouped.set(lesson.wordListId, {
          wordList: lesson.wordList,
          lessons: [],
        });
      }

      grouped.get(lesson.wordListId)!.lessons.push({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        lessonNumber: lesson.lessonNumber,
        wordCount: lesson._count.items,
        status: progress?.status ?? "NOT_STARTED",
        score: progress?.score ?? null,
        startedAt: progress?.startedAt ?? null,
        completedAt: progress?.completedAt ?? null,
        isCompleted: progress?.status === "COMPLETED",
        isUnlocked: false,
        isCurrent: false,
      });
    }

    const wordLists = Array.from(grouped.values()).map((group) => {
      const formattedLessons = group.lessons;

      formattedLessons.forEach((lesson, index) => {
        const previousLesson = formattedLessons[index - 1];

        lesson.isUnlocked =
          index === 0 || previousLesson?.isCompleted === true;

        lesson.isCurrent =
          lesson.isUnlocked && !lesson.isCompleted;
      });

      const completedLessons = formattedLessons.filter(
        (lesson) => lesson.isCompleted
      ).length;

      const totalLessons = formattedLessons.length;

      const totalWords = formattedLessons.reduce(
        (total, lesson) => total + lesson.wordCount,
        0
      );

      return {
        wordList: group.wordList,
        stats: {
          totalLessons,
          completedLessons,
          totalWords,
          completionPercentage: totalLessons
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
        },
        currentLesson:
          formattedLessons.find((lesson) => lesson.isCurrent) ?? null,
        lessons: formattedLessons,
      };
    });

    const continueLesson =
      wordLists
        .map((group) => ({
          wordListTitle: group.wordList.title,
          lesson: group.currentLesson,
        }))
        .find((group) => group.lesson !== null) ?? null;

    return NextResponse.json({
      wordLists,
      continueLesson,
    });
  } catch (error) {
    console.error("GET STUDENT LESSONS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch lessons." },
      { status: 500 }
    );
  }
}