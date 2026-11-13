"use client";

import { useState } from "react";
import { FiCheck, FiEye, FiX } from "react-icons/fi";
import type { LessonWord } from "@/lib/student/lesson-detail";

interface Props {
  words: LessonWord[];
  onComplete: (correct: number) => void;
}

export default function RecallStage({ words, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);

  if (!words.length) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold">Nothing to recall yet</h2>
        <button
          onClick={() => onComplete(0)}
          className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-white"
        >
          Continue
        </button>
      </div>
    );
  }

  const word = words[index];
  const sense = word.senses[0];

  function answer(isCorrect: boolean) {
    const nextCorrect = correct + (isCorrect ? 1 : 0);

    setCorrect(nextCorrect);
    setRevealed(false);

    if (index === words.length - 1) {
      onComplete(nextCorrect);
    } else {
      setIndex((current) => current + 1);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-medium text-violet-600">
        STAGE 3 · IMMEDIATE RECALL
      </p>

      <h1 className="mt-3 text-2xl font-bold text-zinc-900">
        Can you remember this word?
      </h1>

      <p className="mt-2 text-sm text-zinc-500">
        Read the meaning, recall the word, then reveal the answer.
      </p>

      <div className="mt-7 rounded-3xl border border-zinc-200 bg-white p-7 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Meaning
        </p>

        <h2 className="mt-4 text-xl font-semibold text-zinc-900">
          {sense?.meaningEn || "Meaning not available"}
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          {sense?.meaningBn || ""}
        </p>

        {revealed ? (
          <div className="mt-8 rounded-xl bg-violet-50 p-5">
            <p className="text-xs font-medium text-violet-600">
              THE WORD WAS
            </p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {word.word}
            </p>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
          >
            <FiEye /> Reveal answer
          </button>
        )}
      </div>

      {revealed && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(false)}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700"
          >
            <FiX /> Didn't remember
          </button>

          <button
            onClick={() => answer(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white"
          >
            <FiCheck /> Remembered
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-xs text-zinc-400">
        Word {index + 1} of {words.length}
      </p>
    </div>
  );
}