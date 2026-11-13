import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleLesson } from "@/lib/student/lesson-access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const auth = await requireApiRole(request, "user");

  if (!auth.ok) return auth.response;

  try {
    const { lessonId } = await params;

    if (!/^[a-f\d]{24}$/i.test(lessonId)) {
      return NextResponse.json(
        { error: "Invalid lesson ID." },
        { status: 400 }
      );
    }

    const access = await getAccessibleLesson(auth.user.id, lessonId);

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const debug = await prisma.wordListItem.findMany({
  where: {
    wordListId: access.lesson.wordListId,
  },
  select: {
    id: true,
    wordId: true,
    wordListId: true,
    lessonId: true,
    lessonOrder: true,
    word: {
      select: {
        word: true,
      },
    },
  },
});

console.log("LESSON ITEMS DEBUG:", debug);

    const existing = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: auth.user.id,
          lessonId,
        },
      },
    });

    if (existing?.status === "COMPLETED") {
      return NextResponse.json({
        message: "Lesson already completed.",
        progress: existing,
      });
    }

    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: auth.user.id,
          lessonId,
        },
      },
      create: {
        userId: auth.user.id,
        lessonId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      update: {
        status: "IN_PROGRESS",
        startedAt: existing?.startedAt ?? new Date(),
      },
    });

    return NextResponse.json({
      message: "Lesson started.",
      progress,
    });
  } catch (error) {
    console.error("START LESSON ERROR:", error);

    return NextResponse.json(
      { error: "Failed to start lesson." },
      { status: 500 }
    );
  }
}