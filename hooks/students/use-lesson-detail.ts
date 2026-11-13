import { useQuery } from "@tanstack/react-query";
import { fetchLessonDetail } from "@/lib/student/lesson-detail";

export function useStudentLesson(lessonId: string) {
  return useQuery({
    queryKey: ["student", "lesson", lessonId],
    queryFn: () => fetchLessonDetail(lessonId),
    enabled: Boolean(lessonId),
    staleTime: 30_000,
  });
}