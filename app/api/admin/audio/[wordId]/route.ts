
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";

import { requireApiRole } from "@/lib/auth";
import { getAudioBucket } from "@/lib/mongodb-audio";



type RouteContext = {
  params: Promise<{ wordId: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  const auth = await requireApiRole(request, "user");

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { wordId } = await params;
    const accent = request.nextUrl.searchParams.get("accent") ?? "uk";

    if (!/^[a-f\d]{24}$/i.test(wordId)) {
      return NextResponse.json(
        { error: "Invalid word ID." },
        { status: 400 },
      );
    }

    if (accent !== "uk") {
      return NextResponse.json(
        { error: "Unsupported accent." },
        { status: 400 },
      );
    }

    const bucket = await getAudioBucket();

    const file = await bucket
      .find({
        "metadata.wordId": wordId,
        "metadata.accent": accent,
      })
      .limit(1)
      .next();

    if (!file) {
      return NextResponse.json(
        { error: "Audio not found." },
        { status: 404 },
      );
    }

    const audioStream = bucket.openDownloadStream(file._id);
    const webStream = Readable.toWeb(audioStream);

    return new Response(
      webStream as ReadableStream<Uint8Array>,
      {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=86400",
          "Content-Length": String(file.length),
        },
      },
    );
  } catch (error) {
    console.error("GET word audio error:", error);

    return NextResponse.json(
      { error: "Failed to load audio." },
      { status: 500 },
    );
  }
}
