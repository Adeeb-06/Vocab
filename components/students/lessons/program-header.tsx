import { FiBookOpen, FiCheckCircle, FiLayers } from "react-icons/fi";
import type { StudentWordList } from "@/lib/student/lessons";
import Link from "next/link";

interface ProgramHeaderProps {
  program: StudentWordList;
}

export default function ProgramHeader({ program }: ProgramHeaderProps) {
  const { stats, wordList, currentLesson } = program;

  return (
    <section className="rounded-3xl bg-zinc-900 p-6 text-white sm:p-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-violet-300">
            YOUR LEARNING PROGRAM
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {wordList.title}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            {wordList.description ||
              "Build your vocabulary one lesson at a time."}
          </p>
        </div>

        {currentLesson && (
          <Link
            href={`/dashboard/lessons/${currentLesson.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            {currentLesson.status === "IN_PROGRESS"
              ? "Continue learning"
              : "Start next lesson"}
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
        <div>
          <div className="flex items-center gap-2 text-zinc-400">
            <FiBookOpen size={16} />
            <span className="text-xs sm:text-sm">Lessons</span>
          </div>
          <p className="mt-2 text-xl font-semibold">
            {stats.completedLessons}/{stats.totalLessons}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-zinc-400">
            <FiLayers size={16} />
            <span className="text-xs sm:text-sm">Total words</span>
          </div>
          <p className="mt-2 text-xl font-semibold">{stats.totalWords}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-zinc-400">
            <FiCheckCircle size={16} />
            <span className="text-xs sm:text-sm">Completed</span>
          </div>
          <p className="mt-2 text-xl font-semibold">
            {stats.completionPercentage}%
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-400 transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, stats.completionPercentage))}%`,
          }}
        />
      </div>
    </section>
  );
}