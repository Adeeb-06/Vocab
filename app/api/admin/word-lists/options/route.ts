
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const params = request.nextUrl.searchParams;

    const search = params.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(params.get("pageSize")) || 20)
    );

    const where = {
      isVerified: true,
      isActive: true,
      ...(search
        ? {
            word: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where,
        orderBy: { word: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
      prisma.word.count({ where }),
    ]);

    return NextResponse.json({
      words: words.map((word) => ({
        wordId: word.id,
        word: word.word,
        difficulty: word.difficulty,
        senses: word.senses,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Fetch verified words error:", error);

    return NextResponse.json(
      { message: "Could not load verified words." },
      { status: 500 }
    );
  }
}
