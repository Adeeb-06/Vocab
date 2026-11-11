import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

const WORDS_PER_LESSON = 15;

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { wordListId } = body;

    if (typeof wordListId !== "string" || !/^[a-f\d]{24}$/i.test(wordListId)) {
      return NextResponse.json(
        { message: "Please select a valid word list." },
        { status: 400 },
      );
    }

    const wordList = await prisma.wordList.findUnique({
      where: { id: wordListId },
      select: { id: true, title: true },
    });

    if (!wordList) {
      return NextResponse.json(
        { message: "Word list not found." },
        { status: 404 },
      );
    }

    const totalItems = await prisma.wordListItem.count({
      where: { wordListId },
    });

    const unassignedItems = await prisma.wordListItem.count({
      where: {
        wordListId,
        lessonId: null,
      },
    });

    const verifiedActiveItems = await prisma.wordListItem.count({
      where: {
        wordListId,
        word: {
          is: {
            isVerified: true,
            isActive: true,
          },
        },
      },
    });

    console.log("LESSON CREATION DEBUG:", {
      wordListId,
      totalItems,
      unassignedItems,
      verifiedActiveItems,
    });

    const lesson = await prisma.$transaction(async (tx) => {
      const lastLesson = await tx.lesson.findFirst({
        where: { wordListId },
        orderBy: { lessonNumber: "desc" },
        select: { lessonNumber: true },
      });

      const lessonNumber = (lastLesson?.lessonNumber ?? 0) + 1;

      // Get the next 15 unassigned, verified and active words.
      const allItems = await tx.wordListItem.findMany({
        where: {
          wordListId,
          word: {
            is: {
              isVerified: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          wordId: true,
          lessonId: true,
          word: {
            select: {
              word: true,
            },
          },
        },
      });

      const availableItems = allItems
        .filter((item) => !item.lessonId)
        .slice(0, WORDS_PER_LESSON);
      if (availableItems.length < WORDS_PER_LESSON) {
        throw new Error(`NOT_ENOUGH_WORDS:${availableItems.length}`);
      }

      const createdLesson = await tx.lesson.create({
        data: {
          wordListId,
          lessonNumber,
          title: `Lesson ${lessonNumber}`,
          status: "DRAFT",
        },
      });

      // Assign the selected words to this lesson.
      for (const [index, item] of availableItems.entries()) {
        const result = await tx.wordListItem.updateMany({
          where: {
            id: item.id,
            lessonId: null,
          },
          data: {
            lessonId: createdLesson.id,
            lessonOrder: index + 1,
          },
        });
      }

      return {
        ...createdLesson,
        assignedWords: availableItems.map((item) => item.word.word),
      };
    });

    return NextResponse.json(
      {
        message: "Lesson created successfully.",
        lesson,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("NOT_ENOUGH_WORDS:")) {
        const available = Number(error.message.split(":")[1]);

        return NextResponse.json(
          {
            message: `This word list has only ${available} available verified words. You need 15 to create a lesson.`,
          },
          { status: 400 },
        );
      }

      if (error.message === "WORD_ASSIGNMENT_CONFLICT") {
        return NextResponse.json(
          {
            message:
              "Some words were assigned by another request. Please try again.",
          },
          { status: 409 },
        );
      }
    }

    console.error("Create lesson error:", error);

    return NextResponse.json(
      { message: "Failed to create lesson." },
      { status: 500 },
    );
  }
}
