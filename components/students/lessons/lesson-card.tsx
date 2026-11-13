import Link from "next/link";
import {
  FiCheck,
  FiChevronRight,
  FiLock,
  FiPlay,
} from "react-icons/fi";
import type { StudentLesson } from "@/lib/student/lessons";

interface LessonCardProps {
  lesson: StudentLesson;
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const completed = lesson.isCompleted;
  const unlocked = lesson.isUnlocked;

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 transition sm:p-5 ${
        completed
          ? "border-emerald-100 bg-emerald-50/40"
          : unlocked
            ? "border-violet-200 bg-white shadow-sm"
            : "border-zinc-100 bg-zinc-50/70"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          completed
            ? "bg-emerald-100 text-emerald-700"
            : unlocked
              ? "bg-violet-100 text-violet-700"
              : "bg-zinc-200/70 text-zinc-400"
        }`}
      >
        {completed ? (
          <FiCheck size={20} />
        ) : unlocked ? (
          <FiPlay size={19} />
        ) : (
          <FiLock size={18} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`font-semibold ${
              unlocked ? "text-zinc-900" : "text-zinc-400"
            }`}
          >
            {lesson.title}
          </h3>

          {completed && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Completed
            </span>
          )}

          {unlocked && !completed && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              {lesson.status === "IN_PROGRESS" ? "In progress" : "Start"}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-zinc-500">
          {lesson.wordCount} words
          {lesson.description ? ` · ${lesson.description}` : ""}
        </p>
      </div>

      {unlocked ? (
        <Link
          href={`/dashboard/lessons/${lesson.id}`}
          className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
            completed
              ? "text-emerald-700 hover:bg-emerald-100"
              : "bg-violet-600 text-white hover:bg-violet-700"
          }`}
        >
          <span className="hidden sm:inline">
            {completed ? "Review" : lesson.status === "IN_PROGRESS" ? "Continue" : "Start"}
          </span>
          <FiChevronRight size={17} />
        </Link>
      ) : (
        <span className="shrink-0 px-2 text-xs text-zinc-400">
          Locked
        </span>
      )}
    </div>
  );
}