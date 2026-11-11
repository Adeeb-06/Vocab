
import CreateLessonForm from "@/components/admin/lessons/CreateLessonFrom";

export default function CreateLessonPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-medium text-gray-500">
          Admin / Lessons
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Create a lesson
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Organize 15 vocabulary words into a new lesson.
        </p>
      </div>

      <CreateLessonForm />
    </div>
  );
}
