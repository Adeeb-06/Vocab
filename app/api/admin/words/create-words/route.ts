import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface WordInput {
  word: string;
  partOfSpeech: string;
  meaningEn: string;
  meaningBn: string;
  examples: string[];
  synonyms?: string[];
  antonyms?: string[];
  collocations?: string[];
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function isValidWord(value: unknown): value is WordInput {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.word === "string" &&
    item.word.trim().length > 0 &&
    typeof item.partOfSpeech === "string" &&
    typeof item.meaningEn === "string" &&
    typeof item.meaningBn === "string" &&
    isStringArray(item.examples) &&
    (item.synonyms === undefined || isStringArray(item.synonyms)) &&
    (item.antonyms === undefined || isStringArray(item.antonyms)) &&
    (item.collocations === undefined || isStringArray(item.collocations))
  );
}

export async function POST(request: NextRequest) {
  try {
    // Protect the import endpoint
    // const importSecret = process.env.WORD_IMPORT_SECRET;

    // if (!importSecret) {
    //   return NextResponse.json(
    //     { error: "Import secret is not configured." },
    //     { status: 500 }
    //   );
    // }

    // if (
    //   request.headers.get("authorization") !== `Bearer ${importSecret}`
    // ) {
    //   return NextResponse.json(
    //     { error: "Unauthorized." },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();

    // Accept either a raw array or { words: [...] }
    const words: unknown[] = Array.isArray(body)
      ? body
      : body?.words;

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: "Please provide a non-empty words array." },
        { status: 400 }
      );
    }

    const results = {
      total: words.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as { index: number; word?: string; reason: string }[],
    };

    // Process sequentially to avoid overwhelming MongoDB
    for (const [index, item] of words.entries()) {
      if (!isValidWord(item)) {
        results.failed++;

        results.errors.push({
          index,
          reason: "Invalid word data or missing required fields.",
        });

        continue;
      }

      const word = item.word.trim();

      try {
        // Skip existing words
        const existingWord = await prisma.word.findUnique({
          where: { word },
          select: { id: true },
        });

        if (existingWord) {
          results.skipped++;
          continue;
        }

        await prisma.word.create({
          data: {
            word,

            // Other Word fields use Prisma defaults:
            // ipa, audioUrl, difficulty, sources,
            // isVerified, isActive, timestamps

            senses: {
              create: {
                partOfSpeech: item.partOfSpeech.trim(),
                meaningEn: item.meaningEn.trim(),
                meaningBn: item.meaningBn.trim(),

                synonyms: item.synonyms ?? [],
                antonyms: item.antonyms ?? [],
                collocations: item.collocations ?? [],

                examples: {
                  create: item.examples.map((sentence) => ({
                    sentence: sentence.trim(),
                  })),
                },
              },
            },
          },
        });

        results.imported++;
      } catch (error) {
        // Handle duplicate word errors
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          results.skipped++;
          continue;
        }

        results.failed++;

        results.errors.push({
          index,
          word,
          reason: "Failed to save this word.",
        });

        console.error(`Failed to import "${word}":`, error);
      }
    }

    return NextResponse.json({
      message: "Word import completed.",
      ...results,
    });
  } catch (error) {
    console.error("Word import error:", error);

    return NextResponse.json(
      { error: "Something went wrong while importing words." },
      { status: 500 }
    );
  }
}