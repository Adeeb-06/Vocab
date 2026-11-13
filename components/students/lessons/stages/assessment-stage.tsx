"use client";

import { useState } from "react";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import type { LessonWord } from "@/lib/student/lesson-detail";

interface Props {
  words: LessonWord[];
  onContinue: (knownIds: string[]) => void;
}

export default function AssessmentStage({ words, onContinue }: Props) {
  const [known, setKnown] = useState<string[]>([]);

  function toggleWord(id: string) {
    setKnown((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-violet-600">
        STAGE 1 · INITIAL ASSESSMENT
      </p>

      <h1 className="mt-3 text-2xl font-bold text-zinc-900 sm:text-3xl">
        Which words do you already know?
      </h1>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Select a word only if you already understand its meaning. Be honest —
        this helps you focus on words that need more practice.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {words.map((word) => {
          const selected = known.includes(word.id);

          return (
            <button
              key={word.id}
              type="button"
              onClick={() => toggleWord(word.id)}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-violet-400 bg-violet-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span className="font-semibold text-zinc-900">
                {word.word}
              </span>

              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  selected
                    ? "bg-violet-600 text-white"
                    : "border border-zinc-300 text-transparent"
                }`}
              >
                <FiCheck size={14} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {known.length} of {words.length} marked as known
        </p>

        <button
          onClick={() => onContinue(known)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Continue <FiArrowRight />
        </button>
      </div>
    </div>
  );
}