import LessonExperience from "@/components/students/lessons/lesson-experience";

export default async function StudentLessonRoute({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return <LessonExperience lessonId={lessonId} />;
}