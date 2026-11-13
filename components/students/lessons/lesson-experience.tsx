"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FiAlertCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";

import { useStudentLesson } from "@/hooks/students/use-lesson-detail";

import {
  completeStudentLesson,
  startStudentLesson,
} from "@/lib/student/lesson-detail";

import AssessmentStage from "./stages/assessment-stage";
import LearningStage from "./stages/learning-stage";
import RecallStage from "./stages/recall-stage";
import PracticeStage from "./stages/practice-stage";
import ClozeStage from "./stages/cloze-stage";
import ResultsStage from "./stages/results-stage";

interface Props {
  lessonId: string;
}

const stages = [
  "Assessment",
  "Learning",
  "Recall",
  "Practice",
  "Cloze",
  "Results",
];

export default function LessonExperience({ lessonId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  console.log(lessonId, "iddddd")

  const { data, isLoading, isError, error, refetch } =
    useStudentLesson(lessonId);

  const [stage, setStage] = useState(0);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [recallCorrect, setRecallCorrect] = useState(0);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [clozeCorrect, setClozeCorrect] = useState(0);
  const [clozeTotal, setClozeTotal] = useState(0);

  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const lesson = data?.lesson;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        await startStudentLesson(lessonId);
      } catch (error) {
        if (!cancelled) {
          setStartError(
            error instanceof Error ? error.message : "Could not start lesson."
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    start();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const words = useMemo(
    () => lesson?.items.map((item) => item.word) ?? [],
    [lesson]
  );

  const unknownWords = useMemo(
    () => words.filter((word) => !knownIds.includes(word.id)),
    [words, knownIds]
  );

  const totalQuestions =
    unknownWords.length + words.length + clozeTotal;

  const answeredQuestions =
    recallCorrect + practiceCorrect + clozeCorrect;

  const score = totalQuestions
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0;

  async function finishLesson() {
    setSaving(true);
    setSaveError("");

    try {
      await completeStudentLesson(lessonId, score);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["student", "lesson", lessonId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["student", "lessons"],
        }),
      ]);

      router.push("/dashboard/lessons");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save lesson progress."
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || starting) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse space-y-5">
        <div className="h-5 w-32 rounded bg-zinc-200" />
        <div className="h-10 w-64 rounded bg-zinc-200" />
        <div className="h-72 rounded-3xl bg-zinc-200" />
      </div>
    );
  }

  if (isError || startError || !lesson) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <FiAlertCircle className="mx-auto text-3xl text-red-500" />

        <h2 className="mt-3 font-semibold text-zinc-900">
          Unable to open this lesson
        </h2>

        <p className="mt-2 text-sm text-zinc-600">
          {startError ||
            (error instanceof Error ? error.message : "Lesson not found.")}
        </p>

        <button
          onClick={() => refetch()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          <FiRefreshCw /> Try again
        </button>
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <h2 className="font-semibold text-zinc-900">This lesson has no words</h2>
        <Link
          href="/dashboard/lessons"
          className="mt-4 inline-block text-sm text-violet-600"
        >
          Back to lessons
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Link
          href="/dashboard/lessons"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <FiArrowLeft /> Back to lessons
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              LESSON {lesson.lessonNumber}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">
              {lesson.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {words.length} words · {stages[stage]}
            </p>
          </div>

          <span className="text-sm text-zinc-500">
            Step {stage + 1} of {stages.length}
          </span>
        </div>

        <div className="mt-5 flex gap-1.5">
          {stages.map((item, index) => (
            <div
              key={item}
              className={`h-1.5 flex-1 rounded-full ${
                index <= stage ? "bg-violet-600" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {stage === 0 && (
        <AssessmentStage
          words={words}
          onContinue={(ids) => {
            setKnownIds(ids);
            setStage(1);
          }}
        />
      )}

      {stage === 1 && (
        <LearningStage
          words={unknownWords}
          onComplete={() => setStage(2)}
        />
      )}

      {stage === 2 && (
        <RecallStage
          words={unknownWords}
          onComplete={(correct) => {
            setRecallCorrect(correct);
            setStage(3);
          }}
        />
      )}

      {stage === 3 && (
        <PracticeStage
          words={words}
          onComplete={(correct) => {
            setPracticeCorrect(correct);
            setStage(4);
          }}
        />
      )}

      {stage === 4 && (
        <ClozeStage
          lessonId={lessonId}
          words={words}
          onComplete={(correct, total) => {
            setClozeCorrect(correct);
            setClozeTotal(total);
            setStage(5);
          }}
        />
      )}

      {stage === 5 && (
        <>
          <ResultsStage
            totalWords={words.length}
            knownWords={knownIds.length}
            recallCorrect={recallCorrect}
            recallTotal={unknownWords.length}
            practiceCorrect={practiceCorrect}
            practiceTotal={words.length}
            clozeCorrect={clozeCorrect}
            clozeTotal={clozeTotal}
            saving={saving}
            onFinish={finishLesson}
          />

          {saveError && (
            <p className="mt-4 text-center text-sm text-red-600">
              {saveError}
            </p>
          )}
        </>
      )}
    </div>
  );
}