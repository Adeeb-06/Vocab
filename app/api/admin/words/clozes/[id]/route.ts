
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, "admin");

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid cloze ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (typeof body.isVerified !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "isVerified must be a boolean",
        },
        { status: 400 }
      );
    }

    const cloze = await prisma.wordCloze.update({
      where: { id },
      data: {
        isVerified: body.isVerified,
      },
      select: {
        id: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: body.isVerified
        ? "Cloze verified successfully"
        : "Cloze verification removed",
      data: cloze,
    });
  } catch (error) {
    console.error("UPDATE CLOZE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update cloze",
      },
      { status: 500 }
    );
  }
}
