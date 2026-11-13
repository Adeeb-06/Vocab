import { NextResponse } from "next/server";
import { getAudioBucket } from "@/lib/mongodb-audio";



export async function GET() {
  try {
    const bucket = await getAudioBucket();

    // Check that MongoDB can list files in the GridFS bucket
    await bucket.find({}).limit(1).toArray();

    return NextResponse.json({
      success: true,
      message: "MongoDB GridFS connection successful!",
      bucket: "wordAudio",
    });
  } catch (error) {
    console.error("GridFS connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "GridFS connection failed",
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}