
export type VerifiedWord = {
  wordId: string;
  word: string;
  difficulty: number | null;
  senses: {
    partOfSpeech: string;
    meaningEn: string;
    meaningBn: string;
  }[];
};

export type WordListOptionsResponse = {
  words: VerifiedWord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CreateWordListPayload = {
  title: string;
  description?: string;
  wordIds: string[];
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong.");
  }

  return data as T;
}

export async function fetchVerifiedWords(params: {
  page?: number;
  search?: string;
  difficulty:string;
}): Promise<WordListOptionsResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "20",
    search: params.search ?? "",
    difficulty: params.difficulty ?? "",
  });

  const response = await fetch(
    `/api/admin/word-lists/options?${searchParams.toString()}`
  );

  return parseResponse<WordListOptionsResponse>(response);
}

export async function createWordList(
  payload: CreateWordListPayload
) {
  const response = await fetch("/api/admin/word-lists/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{
    message: string;
    wordList: {
      id: string;
      title: string;
      slug: string;
      wordCount: number;
    };
  }>(response);
}



export type AdminWordList = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  wordCount: number;
  lessonCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminWordListItem = {
  itemId: string;
  wordId: string;
  word: string;
  difficulty: number | null;
  senses: {
    partOfSpeech: string;
    meaningEn: string;
    meaningBn: string;
  }[];
  lessonId: string | null;
  lessonOrder: number | null;
  isFree: boolean;
  dayNumber: number | null;
};

export type AdminWordListDetails = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  items: AdminWordListItem[];
  lessons: {
    id: string;
    title: string;
    lessonNumber: number;
    status: "DRAFT" | "PUBLISHED";
  }[];
};

export async function fetchWordLists(
  search = ""
): Promise<{ wordLists: AdminWordList[] }> {
  const params = new URLSearchParams({ search });

  const response = await fetch(
    `/api/admin/word-lists?${params.toString()}`
  );

  return parseResponse(response);
}

export async function fetchWordList(
  id: string
): Promise<{ wordList: AdminWordListDetails }> {
  const response = await fetch(`/api/admin/word-lists/${id}`);

  return parseResponse(response);
}

export async function updateWordList({
  id,
  title,
  description,
  wordIds,
}: {
  id: string;
  title: string;
  description: string;
  wordIds: string[];
}) {
  const response = await fetch(`/api/admin/word-lists/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, description, wordIds }),
  });

  return parseResponse<{
    message: string;
    wordList: AdminWordList | null;
  }>(response);
}

export async function deleteWordList(id: string) {
  const response = await fetch(`/api/admin/word-lists/${id}`, {
    method: "DELETE",
  });

  return parseResponse<{ message: string }>(response);
}
