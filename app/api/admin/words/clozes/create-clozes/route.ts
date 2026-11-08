
import { NextRequest, NextResponse } from "next/server";
import { Prisma, ClozePattern } from "@prisma/client";

import { prisma } from "@/lib/prisma";
// import { requireApiRole } from "@/lib/api-auth";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const VALID_PATTERNS = [
  "sentence_blank",
  "meaning_blank",
  "first_letter",
  "multiple_choice",
  "collocation_blank",
  "synonym_blank",
] as const;

type ClozeInput = {
  wordId: string;
  senseId: string;
  exampleId?: string | null;
  pattern: string;
  prompt: string;
  answerText: string;
  acceptedAnswers?: string[];
  config?: Record<string, unknown> | null;
  explanation?: string | null;
  difficultyLevel?: number;
};

export async function POST(request: NextRequest) {
//   // 1. Admin authentication
//   const auth = await requireApiRole(request, "admin");

//   if (!auth.ok) {
//     return auth.response;
//   }

  try {
    // 2. Parse JSON
    const body = await request.json();

    const clozes: ClozeInput[] = Array.isArray(body)
      ? body
      : body?.clozes;

    if (!Array.isArray(clozes) || clozes.length === 0) {
      return NextResponse.json(
        { error: "Provide a non-empty clozes array." },
        { status: 400 }
      );
    }

    if (clozes.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 clozes per request." },
        { status: 400 }
      );
    }

    // 3. Validate individual records
    const errors: string[] = [];

    clozes.forEach((cloze, index) => {
      const row = index + 1;

      if (!cloze || typeof cloze !== "object") {
        errors.push(`Row ${row}: Invalid object.`);
        return;
      }

      if (
        typeof cloze.wordId !== "string" ||
        !OBJECT_ID_REGEX.test(cloze.wordId)
      ) {
        errors.push(`Row ${row}: Invalid wordId.`);
      }

      if (
        typeof cloze.senseId !== "string" ||
        !OBJECT_ID_REGEX.test(cloze.senseId)
      ) {
        errors.push(`Row ${row}: Invalid senseId.`);
      }

      if (
        cloze.exampleId != null &&
        (typeof cloze.exampleId !== "string" ||
          !OBJECT_ID_REGEX.test(cloze.exampleId))
      ) {
        errors.push(`Row ${row}: Invalid exampleId.`);
      }

      if (
        !VALID_PATTERNS.includes(
          cloze.pattern as (typeof VALID_PATTERNS)[number]
        )
      ) {
        errors.push(`Row ${row}: Invalid pattern.`);
      }

      if (
        typeof cloze.prompt !== "string" ||
        !cloze.prompt.trim()
      ) {
        errors.push(`Row ${row}: Missing prompt.`);
      }

      if (
        typeof cloze.answerText !== "string" ||
        !cloze.answerText.trim()
      ) {
        errors.push(`Row ${row}: Missing answerText.`);
      }

      if (
        cloze.acceptedAnswers !== undefined &&
        (!Array.isArray(cloze.acceptedAnswers) ||
          !cloze.acceptedAnswers.every(
            (answer) => typeof answer === "string"
          ))
      ) {
        errors.push(`Row ${row}: acceptedAnswers must be strings.`);
      }

      if (
        cloze.difficultyLevel !== undefined &&
        (!Number.isInteger(cloze.difficultyLevel) ||
          cloze.difficultyLevel < 1 ||
          cloze.difficultyLevel > 5)
      ) {
        errors.push(`Row ${row}: difficultyLevel must be 1–5.`);
      }

      if (
        cloze.config != null &&
        (typeof cloze.config !== "object" ||
          Array.isArray(cloze.config))
      ) {
        errors.push(`Row ${row}: config must be an object or null.`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: errors.slice(0, 30),
          totalErrors: errors.length,
        },
        { status: 400 }
      );
    }

    // 4. Check that referenced words and senses exist
    const wordIds = [...new Set(clozes.map((c) => c.wordId))];
    const senseIds = [...new Set(clozes.map((c) => c.senseId))];

    const [words, senses] = await Promise.all([
      prisma.word.findMany({
        where: { id: { in: wordIds } },
        select: { id: true },
      }),
      prisma.wordSense.findMany({
        where: { id: { in: senseIds } },
        select: { id: true, wordId: true },
      }),
    ]);

    const existingWordIds = new Set(words.map((w) => w.id));
    const senseMap = new Map(senses.map((s) => [s.id, s.wordId]));

    const referenceErrors: string[] = [];

    clozes.forEach((cloze, index) => {
      if (!existingWordIds.has(cloze.wordId)) {
        referenceErrors.push(
          `Row ${index + 1}: Word not found (${cloze.wordId}).`
        );
      }

      const senseWordId = senseMap.get(cloze.senseId);

      if (!senseWordId) {
        referenceErrors.push(
          `Row ${index + 1}: Sense not found (${cloze.senseId}).`
        );
      } else if (senseWordId !== cloze.wordId) {
        referenceErrors.push(
          `Row ${index + 1}: Sense does not belong to the supplied word.`
        );
      }
    });

    if (referenceErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Some word or sense references are invalid.",
          details: referenceErrors.slice(0, 30),
          totalErrors: referenceErrors.length,
        },
        { status: 400 }
      );
    }

    // 5. Check optional example references
    const exampleIds = [
      ...new Set(
        clozes
          .map((c) => c.exampleId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    if (exampleIds.length > 0) {
      const examples = await prisma.wordExample.findMany({
        where: { id: { in: exampleIds } },
        select: { id: true, senseId: true },
      });

      const exampleMap = new Map(
        examples.map((example) => [example.id, example.senseId])
      );

      const invalidExamples = clozes.flatMap((cloze, index) => {
        if (!cloze.exampleId) return [];

        if (exampleMap.get(cloze.exampleId) !== cloze.senseId) {
          return [`Row ${index + 1}: Example does not belong to this sense.`];
        }

        return [];
      });

      if (invalidExamples.length > 0) {
        return NextResponse.json(
          {
            error: "Some example references are invalid.",
            details: invalidExamples.slice(0, 30),
          },
          { status: 400 }
        );
      }
    }

    // 6. Prepare data for insertion
    const data: Prisma.WordClozeCreateManyInput[] = clozes.map(
      (cloze) => ({
        wordId: cloze.wordId,
        senseId: cloze.senseId,
        exampleId: cloze.exampleId ?? null,

        pattern: cloze.pattern as ClozePattern,
        prompt: cloze.prompt.trim(),
        answerText: cloze.answerText.trim(),

        acceptedAnswers: cloze.acceptedAnswers ?? [
          cloze.answerText.trim(),
        ],

        config: cloze.config
          ? (cloze.config as Prisma.InputJsonValue)
          : undefined,

        explanation: cloze.explanation ?? null,
        difficultyLevel: cloze.difficultyLevel ?? 1,

        // AI-generated content must be reviewed first
        isVerified: false,
        isActive: false,
      })
    );

    // 7. Bulk insert
    const result = await prisma.wordCloze.createMany({
      data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Clozes imported successfully.",
        insertedCount: result.count,
        isVerified: false,
        isActive: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk cloze import error:", error);

    return NextResponse.json(
      { error: "Something went wrong while importing clozes." },
      { status: 500 }
    );
  }
}
