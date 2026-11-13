import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleLesson } from "@/lib/student/lesson-access";
import { getAudioBucket } from "@/lib/mongodb-audio";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiRole(request, "user");

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { lessonId } = await params;

    if (!/^[a-f\d]{24}$/i.test(lessonId)) {
      return NextResponse.json(
        { error: "Invalid lesson ID." },
        { status: 400 },
      );
    }

    const access = await getAccessibleLesson(auth.user.id, lessonId);

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const [lesson, progress] = await Promise.all([
      prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
          id: true,
          title: true,
          description: true,
          lessonNumber: true,
          items: {
            orderBy: { lessonOrder: "asc" },
            select: {
              id: true,
              lessonOrder: true,
              word: {
                select: {
                  id: true,
                  word: true,
                  ipa: true,
                  audioUrl: true,
                  difficulty: true,

                  senses: {
                    select: {
                      id: true,
                      partOfSpeech: true,
                      meaningEn: true,
                      meaningBn: true,
                      synonyms: true,
                      antonyms: true,
                      collocations: true,

                      examples: {
                        select: {
                          id: true,
                          sentence: true,
                        },
                      },
                    },
                  },

                  // Clozes are fetched only through Word.clozes.
                  // Never expose answerText or acceptedAnswers.
                  clozes: {
                    where: {
                      isVerified: true,
                    },
                    select: {
                      id: true,
                      pattern: true,
                      prompt: true,
                      difficultyLevel: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      prisma.userLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: auth.user.id,
            lessonId,
          },
        },
        select: {
          status: true,
          score: true,
          startedAt: true,
          completedAt: true,
        },
      }),
    ]);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    // Fetch available UK audio files for all words in this lesson.
    const wordIds = lesson.items.map((item) => item.word.id);

    const audioFiles =
      wordIds.length > 0
        ? await (
            await getAudioBucket()
          )
            .find({
              "metadata.wordId": { $in: wordIds },
              "metadata.accent": "uk",
            })
            .toArray()
        : [];

    const audioWordIds = new Set(
      audioFiles.map((file) => String(file.metadata?.wordId ?? "")),
    );

    // Attach the streaming URL to each word.
    const lessonWithAudio = {
      ...lesson,
      items: lesson.items.map((item) => ({
        ...item,
        word: {
          ...item.word,
          audioUrl: audioWordIds.has(item.word.id)
            ? `/api/admin/audio/${item.word.id}?accent=uk`
            : null,
        },
      })),
    };

  return NextResponse.json({
  lesson: lessonWithAudio,
  progress,
});
  } catch (error) {
    console.error("GET student lesson error:", error);

    return NextResponse.json(
      { error: "Failed to load lesson." },
      { status: 500 },
    );
  }
}
