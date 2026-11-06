"use client";

import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

type Word = {
  id: string;
  word: string;
  difficulty: number | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  senses: {
    partOfSpeech: string;
    meaningEn: string;
    meaningBn: string;
  }[];
};

type WordsResponse = {
  words: Word[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type Filters = {
  search: string;
  verification: string;
  active: string;
  pageSize: number;
};

async function fetchWords(
  page: number,
  filters: Filters,
): Promise<WordsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(filters.pageSize),
    search: filters.search,
    verification: filters.verification,
    active: filters.active,
  });

  const response = await fetch(`/api/admin/words?${params}`);

  if (!response.ok) {
    throw new Error("Could not load words.");
  }

  return response.json();
}

async function updateVerification(wordId: string, isVerified: boolean) {
  const response = await fetch("/api/admin/words", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wordId, isVerified }),
  });

  if (!response.ok) {
    throw new Error("Could not update verification status.");
  }

  return response.json();
}

export default function WordsTable() {
  const queryClient = useQueryClient();
  const [copiedWordId, setCopiedWordId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    verification: "all",
    active: "all",
    pageSize: 10,
  });

  const [searchInput, setSearchInput] = useState("");

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((current) => ({
        ...current,
        search: searchInput.trim(),
      }));
      setPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const queryKey = ["admin-words", page, filters] as const;

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchWords(page, filters),
    placeholderData: keepPreviousData,
  });

  const verificationMutation = useMutation({
    mutationFn: ({
      wordId,
      isVerified,
    }: {
      wordId: string;
      isVerified: boolean;
    }) => updateVerification(wordId, isVerified),

    onMutate: async ({ wordId, isVerified }) => {
      await queryClient.cancelQueries({
        queryKey: ["admin-words"],
      });

      const previousData = queryClient.getQueryData<WordsResponse>(queryKey);

      queryClient.setQueryData<WordsResponse>(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          words: old.words.map((word) =>
            word.id === wordId ? { ...word, isVerified } : word,
          ),
        };
      });

      return { previousData };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-words"],
      });
    },
  });

  const updateFilter = (
    key: "verification" | "active" | "pageSize",
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: key === "pageSize" ? Number(value) : value,
    }));
    setPage(1);
  };

  async function handleCopyWord(word: Word) {
    const text = `${word.word} english and bangla meaning`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedWordId(word.id);

      setTimeout(() => {
        setCopiedWordId(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  const pagination = data?.pagination;
  const words = data?.words ?? [];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search words..."
            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-gray-500"
          />
        </div>

        <select
          value={filters.verification}
          onChange={(e) => updateFilter("verification", e.target.value)}
          className="rounded-lg border bg-white px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">All verification</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>

        <select
          value={filters.active}
          onChange={(e) => updateFilter("active", e.target.value)}
          className="rounded-lg border bg-white px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filters.pageSize}
          onChange={(e) => updateFilter("pageSize", e.target.value)}
          className="rounded-lg border bg-white px-3 py-2.5 text-sm outline-none"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">All words</h2>
            <p className="mt-1 text-xs text-gray-500">
              {pagination?.total ?? 0} words found
            </p>
          </div>

          {isFetching && !isPending && (
            <span className="text-xs text-gray-500">Updating...</span>
          )}
        </div>

        {isPending ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading words...
          </div>
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">
              {error.message || "Something went wrong."}
            </p>
            <button
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["admin-words"],
                })
              }
              className="mt-3 text-sm font-medium underline"
            >
              Try again
            </button>
          </div>
        ) : words.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No words found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Word</th>
                  <th className="px-5 py-3 font-medium">Meaning</th>
                  <th className="px-5 py-3 font-medium">Difficulty</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Verification
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {words.map((word) => {
                  const sense = word.senses[0];

                  return (
                    <tr key={word.id} className="transition hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {word.word}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleCopyWord(word)}
                            className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900"
                            title="Copy word and meanings"
                          >
                            {copiedWordId === word.id ? "Copied!" : "Copy"}
                          </button>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          {sense?.partOfSpeech || "No part of speech"}
                        </p>
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <p className="truncate text-gray-700">
                          {sense?.meaningEn || "No meaning added"}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {sense?.meaningBn || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {word.difficulty ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            word.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {word.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          disabled={verificationMutation.isPending}
                          onClick={() =>
                            verificationMutation.mutate({
                              wordId: word.id,
                              isVerified: !word.isVerified,
                            })
                          }
                          className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            word.isVerified
                              ? "border border-gray-200 text-gray-700 hover:bg-gray-100"
                              : "bg-gray-900 text-white hover:bg-gray-700"
                          }`}
                        >
                          {word.isVerified ? "Verified" : "Verify"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Showing{" "}
              {pagination.total === 0 ? 0 : (page - 1) * filters.pageSize + 1}
              {" – "}
              {Math.min(page * filters.pageSize, pagination.total)} of{" "}
              {pagination.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600">
                {page} / {Math.max(1, pagination.totalPages)}
              </span>

              <button
                disabled={page >= pagination.totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
