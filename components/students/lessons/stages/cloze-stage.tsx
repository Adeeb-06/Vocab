"use client";

import { useMemo, useState } from "react";
import { FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import type { LessonWord } from "@/lib/student/lesson-detail";
import { submitLessonCloze } from "@/lib/student/lesson-detail";

interface Props {
  lessonId: string;
  words: LessonWord[];
  onComplete: (correct: number, total: number) => void;
}

export default function ClozeStage({
  lessonId,
  words,
  onComplete,
}: Props) {
  const questions = useMemo(
    () =>
      words.flatMap((word) =>
        word.clozes.map((cloze) => ({
          ...cloze,
          word: word.word,
        }))
      ),
    [words]
  );

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{
    isCorrect: boolean;
    explanation?: string | null;
  } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function checkAnswer() {
    const question = questions[index];

    if (!question || !answer.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await submitLessonCloze(
        lessonId,
        question.id,
        answer
      );

      setResult({
        isCorrect: response.isCorrect,
        explanation: response.explanation,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not check your answer."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    const nextCorrect = correct + (result?.isCorrect ? 1 : 0);

    setCorrect(nextCorrect);
    setAnswer("");
    setResult(null);
    setError("");

    if (index === questions.length - 1) {
      onComplete(nextCorrect, questions.length);
    } else {
      setIndex((current) => current + 1);
    }
  }

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <p className="text-sm font-medium text-violet-600">
          STAGE 5 · CLOZE CHALLENGE
        </p>
        <h2 className="mt-3 text-xl font-bold text-zinc-900">
          No cloze questions available yet
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          You can finish this lesson, but there are no verified cloze
          questions assigned to its words.
        </p>
        <button
          onClick={() => onComplete(0, 0)}
          className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-white"
        >
          Continue
        </button>
      </div>
    );
  }

  const question = questions[index];

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-medium text-violet-600">
        STAGE 5 · CLOZE CHALLENGE
      </p>

      <h1 className="mt-3 text-2xl font-bold text-zinc-900">
        Complete the sentence
      </h1>

      <p className="mt-2 text-sm text-zinc-500">
        Use the context to find the missing word.
      </p>

      <div className="mt-7 rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Question {index + 1} of {questions.length}</span>
          <span>{question.pattern.replaceAll("_", " ")}</span>
        </div>

        <p className="mt-7 text-lg font-medium leading-8 text-zinc-900">
          {question.prompt}
        </p>

        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !result && answer.trim()) {
              checkAnswer();
            }
          }}
          disabled={result !== null || submitting}
          placeholder="Your answer..."
          className="mt-7 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-zinc-50"
        />

        {result && (
          <div
            className={`mt-4 rounded-xl p-4 text-sm ${
              result.isCorrect
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <p className="flex items-center gap-2 font-semibold">
              {result.isCorrect ? <FiCheck /> : <FiX />}
              {result.isCorrect ? "Correct answer!" : "Not quite right."}
            </p>

            {result.explanation && (
              <p className="mt-2">{result.explanation}</p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>

      {result ? (
        <button
          onClick={nextQuestion}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white"
        >
          Next question <FiArrowRight />
        </button>
      ) : (
        <button
          onClick={checkAnswer}
          disabled={!answer.trim() || submitting}
          className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-40"
        >
          {submitting ? "Checking..." : "Check answer"}
        </button>
      )}
    </div>
  );
}