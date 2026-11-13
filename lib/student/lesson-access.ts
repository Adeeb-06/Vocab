import { prisma } from "@/lib/prisma";

export async function getAccessibleLesson(
  userId: string,
  lessonId: string
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      wordListId: true,
      lessonNumber: true,
      title: true,
      description: true,
    },
  });

  if (!lesson) {
    return {
      ok: false as const,
      status: 404,
      error: "Lesson not found.",
    };
  }

  const previousLesson = await prisma.lesson.findFirst({
    where: {
      wordListId: lesson.wordListId,
      lessonNumber: { lt: lesson.lessonNumber },
    },
    orderBy: { lessonNumber: "desc" },
    select: { id: true },
  });

  if (previousLesson) {
    const previousProgress =
      await prisma.userLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: previousLesson.id,
          },
        },
        select: { status: true },
      });

    if (previousProgress?.status !== "COMPLETED") {
      return {
        ok: false as const,
        status: 403,
        error: "Complete the previous lesson to unlock this lesson.",
      };
    }
  }

  

  return {
    ok: true as const,
    lesson,
  };
}