import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  const params = request.nextUrl.searchParams;

  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(
    50,
    Math.max(10, Number(params.get("pageSize")) || 10)
  );

  const search = params.get("search")?.trim() || "";
  const verification = params.get("verification") || "all";
  const active = params.get("active") || "all";
  const difficulty = params.get("difficulty") || "all";

const where = {
  ...(search && {
    word: { contains: search },
  }),
  ...(verification === "verified" && { isVerified: true }),
  ...(verification === "unverified" && { isVerified: false }),
  ...(active === "active" && { isActive: true }),
  ...(active === "inactive" && { isActive: false }),

  ...(difficulty !== "all" &&
    ["0", "1", "2"].includes(difficulty) && {
      difficulty: Number(difficulty),
    }),
};
  try {
    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { word: "asc" },
        select: {
          id: true,
          word: true,
          difficulty: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          senses: {
            take: 1,
            select: {
              id:true,
              partOfSpeech: true,
              meaningEn: true,
              meaningBn: true,
            },
          },
        },
      }),
      prisma.word.count({ where }),
    ]);

    return NextResponse.json({
      words,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch words:", error);

    return NextResponse.json(
      { message: "Failed to fetch words." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { wordId, wordIds, isVerified, difficulty } = body;

    // Bulk update
    if (Array.isArray(wordIds)) {
      const validIds =
        wordIds.length > 0 &&
        wordIds.every(
          (id: unknown) => typeof id === "string" && id.length > 0
        );

      if (!validIds) {
        return NextResponse.json(
          { message: "Invalid word IDs." },
          { status: 400 }
        );
      }

      // Bulk verification
      if (typeof isVerified === "boolean") {
        const result = await prisma.word.updateMany({
          where: { id: { in: [...new Set(wordIds)] } },
          data: { isVerified },
        });

        return NextResponse.json({
          success: true,
          updatedCount: result.count,
        });
      }

      // Bulk difficulty
      if (
        typeof difficulty === "number" &&
        Number.isInteger(difficulty)
      ) {
        const result = await prisma.word.updateMany({
          where: { id: { in: [...new Set(wordIds)] } },
          data: { difficulty },
        });

        return NextResponse.json({
          success: true,
          updatedCount: result.count,
        });
      }

      return NextResponse.json(
        { message: "Invalid bulk update data." },
        { status: 400 }
      );
    }

    // Existing single-word verification
    if (typeof wordId !== "string" || !wordId) {
      return NextResponse.json(
        { message: "Invalid word ID." },
        { status: 400 }
      );
    }

    if (typeof isVerified === "boolean") {
      const word = await prisma.word.update({
        where: { id: wordId },
        data: { isVerified },
        select: { id: true, isVerified: true },
      });

      return NextResponse.json({ word });
    }

    // Existing single-word difficulty update
    if (
      difficulty === null ||
      (typeof difficulty === "number" && Number.isInteger(difficulty))
    ) {
      const word = await prisma.word.update({
        where: { id: wordId },
        data: { difficulty },
        select: { id: true, difficulty: true },
      });

      return NextResponse.json({ word });
    }

    return NextResponse.json(
      { message: "Invalid request data." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update words:", error);

    return NextResponse.json(
      { message: "Failed to update words." },
      { status: 500 }
    );
  }
}