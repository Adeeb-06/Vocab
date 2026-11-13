export interface LessonCloze {
  id: string;
  pattern: string;
  prompt: string;
  difficultyLevel: number;
}

export interface LessonExample {
  id: string;
  sentence: string;
}

export interface LessonSense {
  partOfSpeech: string;
  meaningEn: string;
  meaningBn: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  examples: LessonExample[];
}

export interface LessonWord {
  id: string;
  word: string;
  ipa: string | null;
  audioUrl: string | null;
  difficulty: number | null;
  senses: LessonSense[];
  clozes: LessonCloze[];
}

export interface LessonItem {
  id: string;
  lessonOrder: number | null;
  word: LessonWord;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  lessonNumber: number;
  items: LessonItem[];
}

export interface LessonDetailResponse {
  lesson: LessonDetail;
  progress: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    score: number | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
}

export async function fetchLessonDetail(
  lessonId: string
): Promise<LessonDetailResponse> {
  const response = await fetch(`/api/student/lessons/${lessonId}`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load lesson.");
  }

  return data;
}

export async function startStudentLesson(lessonId: string) {
  const response = await fetch(
    `/api/student/lessons/${lessonId}/start`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not start lesson.");
  }

  return data;
}

export async function submitLessonCloze(
  lessonId: string,
  clozeId: string,
  answer: string
) {
  const response = await fetch(
    `/api/student/lessons/${lessonId}/cloze`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clozeId, answer }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not submit your answer.");
  }

  return data as {
    isCorrect: boolean;
    explanation?: string | null;
    updateReason?: string;
  };
}

export async function completeStudentLesson(
  lessonId: string,
  score: number
) {
  const response = await fetch(
    `/api/student/lessons/${lessonId}/complete`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not complete lesson.");
  }

  return data;
}