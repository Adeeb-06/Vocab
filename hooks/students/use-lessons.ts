import { useQuery } from "@tanstack/react-query";
import { fetchStudentLessons } from "@/lib/student/lessons";

export function useStudentLessons() {
  return useQuery({
    queryKey: ["student", "lessons"],
    queryFn: fetchStudentLessons,
    staleTime: 30 * 1000,
  });
}