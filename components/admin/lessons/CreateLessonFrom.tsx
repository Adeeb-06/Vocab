
"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { BookOpen, Layers, Loader2 } from "lucide-react";

import {
  createLesson,
  fetchLessonOptions,
} from "@/lib/admin/lesson";

export default function CreateLessonForm() {
  const queryClient = useQueryClient();

  const [wordListId, setWordListId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    data: options,
    isPending: isLoadingOptions,
    isError: isOptionsError,
    error: optionsError,
    refetch: refetchOptions,
  } = useQuery({
    queryKey: ["admin-lesson-options"],
    queryFn: () => fetchLessonOptions(),
  });

  const wordLists = options?.wordLists ?? [];

  const selectedList = wordLists.find(
    (list) => list.id === wordListId
  );

  const createMutation = useMutation({
    mutationFn: createLesson,

    onSuccess: async (data) => {
      setSuccessMessage(data.message);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-lesson-options"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin-lessons"],
        }),
      ]);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!wordListId || createMutation.isPending) return;

    setSuccessMessage("");

    createMutation.mutate({
      wordListId,
    });
  }

  if (isLoadingOptions) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
        Loading word lists...
      </div>
    );
  }

  if (isOptionsError) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <p className="text-sm text-red-600">
          {optionsError.message || "Could not load word lists."}
        </p>

        <button
          type="button"
          onClick={() => refetchOptions()}
          className="mt-3 text-sm font-medium underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {/* Word list selection */}
      <div className="rounded-xl border bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Layers className="h-5 w-5 text-gray-700" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Select a word list
            </h2>
            <p className="text-sm text-gray-500">
              Choose the source for this lesson.
            </p>
          </div>
        </div>

        <select
          value={wordListId}
          onChange={(e) => {
            setWordListId(e.target.value);
            setSuccessMessage("");
          }}
          disabled={createMutation.isPending}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-gray-500"
        >
          <option value="">Choose a word list</option>

          {wordLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.title}
            </option>
          ))}
        </select>

        {wordLists.length === 0 && (
          <p className="mt-3 text-sm text-amber-600">
            No word lists found. Create a word list first.
          </p>
        )}
      </div>

      {/* Lesson preview */}
      <div className="rounded-xl border bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <BookOpen className="h-5 w-5 text-gray-700" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Lesson preview
            </h2>
            <p className="text-sm text-gray-500">
              Lesson details are generated automatically.
            </p>
          </div>
        </div>

        {selectedList ? (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Lesson name
            </p>

            <h3 className="mt-1 text-xl font-semibold text-gray-900">
              Lesson {selectedList.nextLessonNumber}
            </h3>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 text-sm">
              <span className="text-gray-500">Words per lesson</span>
              <span className="font-semibold text-gray-900">
                15 words
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              The next 15 available verified and active words will
              automatically be assigned in their existing word-list order.
              Already assigned words will be skipped.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-gray-500">
              Select a word list to preview your lesson.
            </p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {createMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {createMutation.error.message}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={
          !wordListId ||
          createMutation.isPending ||
          wordLists.length === 0
        }
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {createMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating lesson...
          </>
        ) : (
          "Create draft lesson"
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Lessons are created as drafts. You can publish them later.
      </p>
    </form>
  );
}
