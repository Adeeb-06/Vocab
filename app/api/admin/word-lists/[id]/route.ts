
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function createSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { message: "Invalid word list ID." },
        { status: 400 }
      );
    }

    const wordList = await prisma.wordList.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            word: {
              select: {
                id: true,
                word: true,
                difficulty: true,
                senses: {
                  take: 1,
                  orderBy: { createdAt: "asc" },
                  select: {
                    partOfSpeech: true,
                    meaningEn: true,
                    meaningBn: true,
                  },
                },
              },
            },
          },
        },
        lessons: {
          orderBy: { lessonNumber: "asc" },
          select: {
            id: true,
            title: true,
            lessonNumber: true,
            status: true,
          },
        },
      },
    });

    if (!wordList) {
      return NextResponse.json(
        { message: "Word list not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      wordList: {
        id: wordList.id,
        title: wordList.title,
        slug: wordList.slug,
        description: wordList.description,
        items: wordList.items.map((item) => ({
          itemId: item.id,
          wordId: item.word.id,
          word: item.word.word,
          difficulty: item.word.difficulty,
          senses: item.word.senses,
          lessonId: item.lessonId,
          lessonOrder: item.lessonOrder,
          isFree: item.isFree,
          dayNumber: item.dayNumber,
        })),
        lessons: wordList.lessons,
      },
    });
  } catch (error) {
    console.error("Fetch word list details error:", error);

    return NextResponse.json(
      { message: "Could not load this word list." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { message: "Invalid word list ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, wordIds } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return NextResponse.json(
        { message: "Title must be between 1 and 100 characters." },
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

    if (
      wordIds !== undefined &&
      (!Array.isArray(wordIds) ||
        wordIds.length === 0 ||
        wordIds.length > 2000 ||
        !wordIds.every(
          (wordId: unknown) =>
            typeof wordId === "string" &&
            /^[a-f\d]{24}$/i.test(wordId)
        ))
    ) {
      return NextResponse.json(
        { message: "Please provide a valid word selection." },
        { status: 400 }
      );
    }

    if (
      Array.isArray(wordIds) &&
      new Set(wordIds).size !== wordIds.length
    ) {
      return NextResponse.json(
        { message: "Duplicate words are not allowed." },
        { status: 400 }
      );
    }

    const slug = createSlug(title);

    if (!slug) {
      return NextResponse.json(
        { message: "Please provide a title that creates a valid slug." },
        { status: 400 }
      );
    }

    const existingList = await prisma.wordList.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            wordId: true,
          },
        },
      },
    });

    if (!existingList) {
      return NextResponse.json(
        { message: "Word list not found." },
        { status: 404 }
      );
    }

    // Only newly added words need to be checked.
    if (wordIds !== undefined) {
      const existingWordIds = new Set(
        existingList.items.map((item) => item.wordId)
      );

      const newWordIds = wordIds.filter(
        (wordId: string) => !existingWordIds.has(wordId)
      );

      if (newWordIds.length > 0) {
        const verifiedWords = await prisma.word.findMany({
          where: {
            id: { in: newWordIds },
            isVerified: true,
            isActive: true,
          },
          select: { id: true },
        });

        if (verifiedWords.length !== newWordIds.length) {
          return NextResponse.json(
            {
              message:
                "Some newly added words are no longer verified or active.",
            },
            { status: 409 }
          );
        }

        const assignedElsewhere = await prisma.wordListItem.findMany({
          where: {
            wordId: { in: newWordIds },
            wordListId: { not: id },
          },
          select: { wordId: true },
        });

        if (assignedElsewhere.length > 0) {
          return NextResponse.json(
            {
              message:
                "Some selected words already belong to another word list.",
            },
            { status: 409 }
          );
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.wordList.update({
        where: { id },
        data: {
          title: title.trim(),
          slug,
          description: description?.trim() || null,
        },
      });

      if (wordIds !== undefined) {
        const desiredIds = new Set(wordIds as string[]);
        const existingIds = new Set(
          existingList.items.map((item) => item.wordId)
        );

        // Remove items that are no longer selected.
        const removedIds = existingList.items
          .filter((item) => !desiredIds.has(item.wordId))
          .map((item) => item.id);

        if (removedIds.length > 0) {
          await tx.wordListItem.deleteMany({
            where: { id: { in: removedIds } },
          });
        }

        // Move retained items to temporary unique positions to avoid
        // collisions with the unique (wordListId, order) constraint.
        const retainedItems = existingList.items.filter((item) =>
          desiredIds.has(item.wordId)
        );

        for (let index = 0; index < retainedItems.length; index++) {
          await tx.wordListItem.update({
            where: { id: retainedItems[index].id },
            data: { order: -(index + 1) },
          });
        }

        const itemIdsByWordId = new Map<string, string>();

        for (const item of retainedItems) {
          itemIdsByWordId.set(item.wordId, item.id);
        }

        // Create newly selected items in temporary positions.
        let newItemIndex = 0;

        for (const wordId of wordIds as string[]) {
          if (itemIdsByWordId.has(wordId)) continue;

          const item = await tx.wordListItem.create({
            data: {
              wordListId: id,
              wordId,
              order: -(retainedItems.length + newItemIndex + 1),
              isFree: true,
            },
          });

          itemIdsByWordId.set(wordId, item.id);
          newItemIndex++;
        }

        // Apply the final word-list order.
        for (let index = 0; index < (wordIds as string[]).length; index++) {
          const wordId = (wordIds as string[])[index];
          const itemId = itemIdsByWordId.get(wordId);

          if (!itemId) {
            throw new Error("Could not find a word-list item.");
          }

          await tx.wordListItem.update({
            where: { id: itemId },
            data: { order: index + 1 },
          });
        }
      }

      return tx.wordList.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              items: true,
              lessons: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      message: "Word list updated successfully.",
      wordList: updated
        ? {
            id: updated.id,
            title: updated.title,
            slug: updated.slug,
            description: updated.description,
            wordCount: updated._count.items,
            lessonCount: updated._count.lessons,
          }
        : null,
    });
  } catch (error) {
    console.error("Update word list error:", error);

    const prismaError = error as { code?: string };

    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { message: "A word list with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update word list." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { message: "Invalid word list ID." },
        { status: 400 }
      );
    }

    const wordList = await prisma.wordList.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        lessons: {
          select: { id: true },
        },
      },
    });

    if (!wordList) {
      return NextResponse.json(
        { message: "Word list not found." },
        { status: 404 }
      );
    }

    const lessonIds = wordList.lessons.map((lesson) => lesson.id);

    await prisma.$transaction(async (tx) => {
      if (lessonIds.length > 0) {
        // Delete dependent records explicitly before deleting lessons.
        await tx.userAnswerAttempt.deleteMany({
          where: { lessonId: { in: lessonIds } },
        });

        await tx.userLessonProgress.deleteMany({
          where: { lessonId: { in: lessonIds } },
        });
      }

      await tx.wordListItem.deleteMany({
        where: { wordListId: id },
      });

      if (lessonIds.length > 0) {
        await tx.lesson.deleteMany({
          where: { id: { in: lessonIds } },
        });
      }

      await tx.wordList.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: `"${wordList.title}" and its lessons and associated student history were permanently deleted.`,
    });
  } catch (error) {
    console.error("Delete word list error:", error);

    return NextResponse.json(
      { message: "Failed to delete word list." },
      { status: 500 }
    );
  }
}
