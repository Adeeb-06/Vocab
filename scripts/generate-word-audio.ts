
import { prisma } from "@/lib/prisma";
import {
  getAudioBucket,
  getAudioDatabase,
} from "@/lib/mongodb-audio";

import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pipeline } from "node:stream/promises";

const execFileAsync = promisify(execFile);

const PYTHON = process.env.PYTHON ?? "python";

const VOICES = [
  { accent: "uk", voice: "en-GB-SoniaNeural" },
];

async function main() {
  const bucket = await getAudioBucket();
  const db = await getAudioDatabase();

  // Prevent duplicate audio entries for the same word and accent.
  await db.collection("wordAudio.files").createIndex(
    {
      "metadata.wordId": 1,
      "metadata.accent": 1,
    },
    {
      unique: true,
      name: "wordId_accent_unique",
    }
  );

  // Fetch active words from your existing Prisma database.
  let words = await prisma.word.findMany({
    select: {
      id: true,
      word: true,
    },
    orderBy: {
      word: "asc",
    },
  });

  // Optional test limit: --limit 5
  const limitIndex = process.argv.indexOf("--limit");

  if (limitIndex !== -1) {
    const limit = Number(process.argv[limitIndex + 1]);

    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Invalid --limit value");
    }

    words = words.slice(0, limit);
  }

  // Optional single-word test: --word benevolent
  const wordIndex = process.argv.indexOf("--word");

  if (wordIndex !== -1) {
    const target = process.argv[wordIndex + 1]?.toLowerCase();

    if (!target) {
      throw new Error("Please provide a word after --word");
    }

    words = words.filter(
      (item) => item.word.toLowerCase() === target
    );
  }

  if (words.length === 0) {
    console.log("No matching active words found.");
    return;
  }

  const tempDir = await mkdtemp(
    join(tmpdir(), "vocab-audio-")
  );

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Found ${words.length} words.`);
  console.log("Starting audio generation...\n");

  try {
    for (let i = 0; i < words.length; i++) {
      const item = words[i];

      for (const voiceConfig of VOICES) {
        const { accent, voice } = voiceConfig;

        const metadataFilter = {
          "metadata.wordId": item.id,
          "metadata.accent": accent,
        };

        // Resume support: skip audio that already exists.
        const exists = await bucket
          .find(metadataFilter)
          .hasNext();

        if (exists) {
          skipped++;
          console.log(
            `[${i + 1}/${words.length}] SKIP ${item.word} (${accent})`
          );
          continue;
        }

        const filePath = join(
          tempDir,
          `${i}-${accent}.mp3`
        );

        try {
          // Generate pronunciation using Edge TTS.
          await execFileAsync(
            PYTHON,
            [
              "-m",
              "edge_tts",
              "--voice",
              voice,
              "--text",
              item.word,
              "--write-media",
              filePath,
            ],
            {
              windowsHide: true,
              maxBuffer: 1024 * 1024,
            }
          );

          const fileInfo = await stat(filePath);

          if (fileInfo.size === 0) {
            throw new Error("Generated audio file is empty");
          }

          // Upload the MP3 to MongoDB GridFS.
          const uploadStream = bucket.openUploadStream(
            `${item.word}-${accent}.mp3`,
            {
              contentType: "audio/mpeg",
              metadata: {
                wordId: item.id,
                word: item.word,
                accent,
                voice,
                contentType: "audio/mpeg",
              },
            }
          );

          try {
            await pipeline(
              createReadStream(filePath),
              uploadStream
            );
          } catch (error) {
            await uploadStream.abort().catch(() => {});
            throw error;
          }

          uploaded++;

          console.log(
            `[${i + 1}/${words.length}] UPLOADED ${item.word} (${accent}) - ${(fileInfo.size / 1024).toFixed(2)} KB`
          );
        } catch (error) {
          failed++;

          console.error(
            `FAILED: ${item.word} (${accent})`,
            error instanceof Error
              ? error.message
              : error
          );
        }
      }
    }
  } finally {
    await rm(tempDir, {
      recursive: true,
      force: true,
    });
  }

  console.log("\n========== SUMMARY ==========");
  console.log(`Words processed: ${words.length}`);
  console.log(`Audio files uploaded: ${uploaded}`);
  console.log(`Audio files skipped: ${skipped}`);
  console.log(`Audio files failed: ${failed}`);
}

main()
  .catch((error) => {
    console.error("Audio generation stopped:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
