
export type LessonWordListOption = {
  id: string;
  title: string;
  nextLessonNumber: number;
};

export type LessonOptionsResponse = {
  wordLists: LessonWordListOption[];
};


async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data as T;
}

export async function fetchLessonOptions(): Promise<LessonOptionsResponse> {
  const response = await fetch("/api/admin/lessons/options", {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse<LessonOptionsResponse>(response);
}

export type CreateLessonPayload = {
  wordListId: string;
  title:string;
};

export async function createLesson(payload: CreateLessonPayload) {
  const response = await fetch("/api/admin/lessons/create-lesson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{
    message: string;
    lesson: {
      id: string;
      lessonNumber: number;
      title: string;
    };
  }>(response);
}
