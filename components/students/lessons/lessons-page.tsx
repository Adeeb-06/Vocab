"use client";

import { FiAlertCircle, FiBookOpen, FiRefreshCw } from "react-icons/fi";
import { useStudentLessons } from "@/hooks/students/use-lessons";
import ProgramHeader from "./program-header";
import LessonList from "./lesson-list";

export default function LessonsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useStudentLessons();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 rounded-3xl bg-zinc-200" />
        <div className="h-8 w-40 rounded-lg bg-zinc-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-20 rounded-2xl bg-zinc-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <FiAlertCircle className="mx-auto text-3xl text-red-500" />

        <h2 className="mt-3 font-semibold text-zinc-900">
          Couldn't load your lessons
        </h2>

        <p className="mt-1 text-sm text-zinc-600">
          {error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."}
        </p>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          <FiRefreshCw className={isFetching ? "animate-spin" : ""} />
          Try again
        </button>
      </div>
    );
  }

const wordLists = data?.wordLists ?? [];

if (!wordLists.length) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <FiBookOpen size={26} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-zinc-900">
          Your learning journey starts here
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          You don't have an active learning program yet. Once you're enrolled,
          your lessons will appear here.
        </p>
      </div>
    );
  }

  return (
  <div className="space-y-10">
    {wordLists.map((wordList) => (
      <section key={wordList.wordList.id} className="space-y-7">
        <ProgramHeader program={wordList} />

        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-zinc-900">
              Your lessons
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Complete each lesson to unlock the next one.
            </p>
          </div>

          <LessonList lessons={wordList.lessons} />
        </div>
      </section>
    ))}
  </div>
);
}