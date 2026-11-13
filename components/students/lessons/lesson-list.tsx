import { FiBookOpen } from "react-icons/fi";
import type { StudentLesson } from "@/lib/student/lessons";
import LessonCard from "./lesson-card";

interface LessonListProps {
  lessons: StudentLesson[];
}

export default function LessonList({ lessons }: LessonListProps) {
  if (!lessons.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
        <FiBookOpen className="mx-auto text-3xl text-zinc-300" />
        <h3 className="mt-3 font-semibold text-zinc-800">
          No lessons available
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Your lessons will appear here once they are added to your program.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}