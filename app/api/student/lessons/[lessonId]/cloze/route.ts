import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleLesson } from "@/lib/student/lesson-access";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

const BOX_INTERVALS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiRole(request, "user");

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { lessonId } = await params;

    if (!/^[a-f\d]{24}$/i.test(lessonId)) {
      return NextResponse.json(
        { error: "Invalid lesson ID." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    const clozeId = body?.clozeId;
    const answer = body?.answer;

    if (
      typeof clozeId !== "string" ||
      !/^[a-f\d]{24}$/i.test(clozeId) ||
      typeof answer !== "string" ||
      !answer.trim() ||
      answer.length > 500
    ) {
      return NextResponse.json(
        { error: "A valid cloze ID and answer are required." },
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

    // Fetch the answer only on the server.
    const cloze = await prisma.wordCloze.findUnique({
      where: { id: clozeId },
      select: {
        id: true,
        wordId: true,
        answerText: true,
        acceptedAnswers: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!cloze || !cloze.isActive || !cloze.isVerified) {
      return NextResponse.json(
        { error: "Cloze question not found." },
        { status: 404 }
      );
    }

    // Ensure this cloze belongs to a word in the requested lesson.
    const lessonItem = await prisma.wordListItem.findFirst({
      where: {
        lessonId,
        wordId: cloze.wordId,
      },
      select: { id: true },
    });

    if (!lessonItem) {
      return NextResponse.json(
        { error: "This question does not belong to this lesson." },
        { status: 403 }
      );
    }

    const submittedAnswer = normalizeAnswer(answer);

    const validAnswers = [
      cloze.answerText,
      ...cloze.acceptedAnswers,
    ].map(normalizeAnswer);

    const isCorrect = validAnswers.includes(submittedAnswer);

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Save the answer attempt.
      await tx.userAnswerAttempt.create({
        data: {
          userId: auth.user.id,
          lessonId,
          wordId: cloze.wordId,
          clozeId: cloze.id,
          questionType: "CLOZE",
          answerText: answer.trim(),
          isCorrect,
          answeredAt: now,
        },
      });

      const existingProgress = await tx.userWordProgress.findUnique({
        where: {
          userId_wordId: {
            userId: auth.user.id,
            wordId: cloze.wordId,
          },
        },
      });

      // First encounter: introduce the word into Box 1.
      if (!existingProgress) {
        const nextReviewAt = new Date(now);
        nextReviewAt.setDate(
          nextReviewAt.getDate() + BOX_INTERVALS[1]
        );

        const progress = await tx.userWordProgress.create({
          data: {
            userId: auth.user.id,
            wordId: cloze.wordId,
            box: 1,
            introducedAt: now,
            lastReviewedAt: now,
            nextReviewAt,
            lapses: isCorrect ? 0 : 1,
          },
        });

        return {
          progress,
          levelUpdated: true,
          updateReason: "FIRST_ATTEMPT",
        };
      }

      // A word that isn't due cannot be promoted by same-day practice.
      if (existingProgress.nextReviewAt > now) {
        return {
          progress: existingProgress,
          levelUpdated: false,
          updateReason: "NOT_DUE",
        };
      }

      // Scheduled review: correct = promote, incorrect = reset.
      const nextBox = isCorrect
        ? Math.min(existingProgress.box + 1, 5)
        : 1;

      const nextReviewAt = new Date(now);
      nextReviewAt.setDate(
        nextReviewAt.getDate() + BOX_INTERVALS[nextBox]
      );

      const progress = await tx.userWordProgress.update({
        where: {
          userId_wordId: {
            userId: auth.user.id,
            wordId: cloze.wordId,
          },
        },
        data: {
          box: nextBox,
          nextReviewAt,
          lastReviewedAt: now,
          lapses: isCorrect
            ? existingProgress.lapses
            : existingProgress.lapses + 1,
        },
      });

      return {
        progress,
        levelUpdated: true,
        updateReason: isCorrect ? "PROMOTED" : "RESET",
      };
    });

    return NextResponse.json({
      isCorrect,
      progress: {
        box: result.progress.box,
        nextReviewAt: result.progress.nextReviewAt,
        lapses: result.progress.lapses,
      },
      levelUpdated: result.levelUpdated,
      updateReason: result.updateReason,
    });
  } catch (error) {
    console.error("POST student cloze error:", error);

    return NextResponse.json(
      { error: "Failed to submit cloze answer." },
      { status: 500 }
    );
  }
}