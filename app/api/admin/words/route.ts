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

  const where = {
    ...(search && {
      word: { contains: search },
    }),
    ...(verification === "verified" && { isVerified: true }),
    ...(verification === "unverified" && { isVerified: false }),
    ...(active === "active" && { isActive: true }),
    ...(active === "inactive" && { isActive: false }),
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
    const { wordId, isVerified } = body;

    if (
      typeof wordId !== "string" ||
      typeof isVerified !== "boolean"
    ) {
      return NextResponse.json(
        { message: "Invalid request data." },
        { status: 400 }
      );
    }

    const word = await prisma.word.update({
      where: { id: wordId },
      data: { isVerified },
      select: {
        id: true,
        isVerified: true,
      },
    });

    return NextResponse.json({ word });
  } catch (error) {
    console.error("Failed to update word:", error);

    return NextResponse.json(
      { message: "Failed to update word." },
      { status: 500 }
    );
  }
}