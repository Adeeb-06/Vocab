export interface StudentLesson {
  id: string;
  title: string;
  description: string | null;
  lessonNumber: number;
  wordCount: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface StudentWordList {
  wordList: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
  };
  stats: {
    totalLessons: number;
    completedLessons: number;
    totalWords: number;
    completionPercentage: number;
  };
  currentLesson: StudentLesson | null;
  lessons: StudentLesson[];
}

export interface StudentLessonsResponse {
  wordLists: StudentWordList[];
  continueLesson: {
    wordListTitle: string;
    lesson: StudentLesson;
  } | null;
}

export async function fetchStudentLessons(): Promise<StudentLessonsResponse> {
  const response = await fetch("/api/student/lessons", {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load your lessons.");
  }

  return data;
}