
"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchVerifiedWords,
  type VerifiedWord,
} from "@/lib/admin/word-list";

type Props = {
  selectedWords: VerifiedWord[];
  onToggle: (word: VerifiedWord) => void;
};

export default function VerifiedWordPicker({
  selectedWords,
  onToggle,
}: Props) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

const {
  data,
  isPending,
  isFetching,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ["admin-verified-words", page, search, difficulty],
  queryFn: () => fetchVerifiedWords({ page, search, difficulty }),
  placeholderData: keepPreviousData,
});
  const words = data?.words ?? [];
  const pagination = data?.pagination;

  const selectedIds = new Set(
    selectedWords.map((word) => word.wordId)
  );

  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="space-y-4 border-b p-5">
        <div>
          <h2 className="font-semibold text-gray-900">
            Verified vocabulary
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Only active and verified words from your word bank are shown.
          </p>
        </div>

        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search vocabulary..."
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
        />
        <select
  value={difficulty}
  onChange={(e) => {
    setDifficulty(e.target.value);
    setPage(1);
  }}
  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500"
>
  <option value="all">All difficulty levels</option>
  <option value="0">Level 0</option>
  <option value="1">Level 1</option>
  <option value="2">Level 2</option>
</select>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{pagination?.total ?? 0} verified words</span>
          {isFetching && !isPending && <span>Updating...</span>}
        </div>
      </div>

      {isPending ? (
        <div className="p-10 text-center text-sm text-gray-500">
          Loading verified words...
        </div>
      ) : isError ? (
        <div className="p-8 text-center">
          <p className="text-sm text-red-600">
            {error.message || "Could not load words."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-sm font-medium underline"
          >
            Try again
          </button>
        </div>
      ) : words.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-500">
          No verified words found.
        </div>
      ) : (
        <div className="divide-y">
          {words.map((word) => {
            const selected = selectedIds.has(word.wordId);
            const sense = word.senses[0];

            return (
              <label
                key={word.wordId}
                className="flex cursor-pointer items-center gap-3 px-5 py-4 transition hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(word)}
                  className="size-4 shrink-0 accent-gray-900"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {word.word}
                    </span>

                    {sense?.partOfSpeech && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                        {sense.partOfSpeech}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-sm text-gray-600">
                    {sense?.meaningEn || "No English meaning"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {sense?.meaningBn || "No Bangla meaning"}
                  </p>
                </div>

              {word.difficulty !== null && (
  <span className="shrink-0 text-xs text-gray-400">
    Level {word.difficulty}
  </span>
)}
              </label>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-5 py-4">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                page >= pagination.totalPages || isFetching
              }
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
