
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // // 1. Admin authentication
    const auth = await requireRole(request, "admin");

    if (!auth.ok) {
      return auth.response;
    }

    // 2. Pagination
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 50)
    );

    const skip = (page - 1) * limit;

    // 3. Optional filters
    const activeParam = searchParams.get("isActive");
    const verifiedParam = searchParams.get("isVerified");

    const isActive =
      activeParam === "true"
        ? true
        : activeParam === "false"
          ? false
          : undefined;

    const isVerified =
      verifiedParam === "true"
        ? true
        : verifiedParam === "false"
          ? false
          : undefined;

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(isVerified !== undefined && { isVerified }),
    };

    // 4. Fetch clozes and total count
    const [clozes, total] = await Promise.all([
      prisma.wordCloze.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          word: {
            select: {
              id: true,
              word: true,
              difficulty: true,
              isActive: true,
              isVerified: true,
            },
          },

          sense: {
            select: {
              id: true,
              partOfSpeech: true,
              meaningEn: true,
              meaningBn: true,
              synonyms: true,
              antonyms: true,
              collocations: true,
            },
          },

          example: {
            select: {
              id: true,
              sentence: true,
            },
          },
        },
      }),

      prisma.wordCloze.count({ where }),
    ]);

    // 5. Response
    return NextResponse.json(
      {
        success: true,
        data: clozes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET ADMIN CLOZES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch clozes",
      },
      { status: 500 }
    );
  }
}
