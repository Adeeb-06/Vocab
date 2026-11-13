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

    const body = await request.json();
    const score = Number(body.score);

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return NextResponse.json(
        { error: "Score must be between 0 and 100." },
        { status: 400 }
      );
    }

    const existing = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: auth.user.id,
          lessonId,
        },
      },
    });

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
        status: "COMPLETED",
        score,
        startedAt: new Date(),
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        score,
        completedAt: new Date(),
        startedAt: existing?.startedAt ?? new Date(),
      },
    });

    return NextResponse.json({
      message: "Lesson completed successfully.",
      progress,
    });
  } catch (error) {
    console.error("COMPLETE LESSON ERROR:", error);

    return NextResponse.json(
      { error: "Failed to complete lesson." },
      { status: 500 }
    );
  }
}