
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
}): Promise<WordListOptionsResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "20",
    search: params.search ?? "",
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
