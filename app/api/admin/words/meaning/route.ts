import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");

    if (!auth.ok) return auth.response;

    const { wordId, senseId, meaningEn, meaningBn } =
      await request.json();

    if (
      !wordId ||
      !senseId ||
      typeof meaningEn !== "string" ||
      typeof meaningBn !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 },
      );
    }

    if (
      !/^[a-fA-F0-9]{24}$/.test(wordId) ||
      !/^[a-fA-F0-9]{24}$/.test(senseId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid ID." },
        { status: 400 },
      );
    }

    const sense = await prisma.wordSense.findFirst({
      where: {
        id: senseId,
        wordId,
      },
    });

    if (!sense) {
      return NextResponse.json(
        { success: false, message: "Word sense not found." },
        { status: 404 },
      );
    }

    const updatedSense = await prisma.wordSense.update({
      where: { id: senseId },
      data: {
        meaningEn: meaningEn.trim(),
        meaningBn: meaningBn.trim(),
      },
      select: {
        id: true,
        meaningEn: true,
        meaningBn: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Meanings updated successfully.",
      data: updatedSense,
    });
  } catch (error) {
    console.error("UPDATE_WORD_MEANING_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update meanings." },
      { status: 500 },
    );
  }
}