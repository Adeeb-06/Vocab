"use client";

import { useState } from "react";
import { FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import type { LessonWord } from "@/lib/student/lesson-detail";

interface Props {
  words: LessonWord[];
  onComplete: (correct: number) => void;
}

export default function PracticeStage({ words, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);

  if (!words.length) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold">No practice questions available</h2>
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

  function checkAnswer() {
    const isCorrect =
      answer.trim().toLowerCase() === word.word.toLowerCase();

    setFeedback(isCorrect);
  }

  function nextQuestion() {
    const nextCorrect = correct + (feedback === true ? 1 : 0);

    setCorrect(nextCorrect);
    setAnswer("");
    setFeedback(null);

    if (index === words.length - 1) {
      onComplete(nextCorrect);
    } else {
      setIndex((current) => current + 1);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-medium text-violet-600">
        STAGE 4 · MIXED PRACTICE
      </p>

      <h1 className="mt-3 text-2xl font-bold text-zinc-900">
        Find the right word
      </h1>

      <div className="mt-7 rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Question {index + 1} of {words.length}
        </p>

        <h2 className="mt-5 text-xl font-semibold text-zinc-900">
          {sense?.meaningEn || "Meaning not available"}
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          {sense?.meaningBn || ""}
        </p>

        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !feedback && answer.trim()) {
              checkAnswer();
            }
          }}
          disabled={feedback !== null}
          placeholder="Type the word..."
          className="mt-7 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-zinc-50"
        />

        {feedback !== null && (
          <div
            className={`mt-4 rounded-xl p-4 text-sm ${
              feedback
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {feedback ? <FiCheck /> : <FiX />}
              {feedback ? "Correct!" : `The correct answer is ${word.word}`}
            </div>
          </div>
        )}
      </div>

      {feedback === null ? (
        <button
          disabled={!answer.trim()}
          onClick={checkAnswer}
          className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Check answer
        </button>
      ) : (
        <button
          onClick={nextQuestion}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white"
        >
          Next question <FiArrowRight />
        </button>
      )}
    </div>
  );
}