
"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createWordList,
  type VerifiedWord,
} from "@/lib/admin/word-list";

import WordListDetails from "./WordListsDetails";
import VerifiedWordPicker from "./VerifiedWordPicker";
import SelectedListWords from "./SelectedWordLists";

export default function CreateWordListForm() {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWords, setSelectedWords] = useState<VerifiedWord[]>([]);

  const mutation = useMutation({
    mutationFn: createWordList,

    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setSelectedWords([]);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-word-lists"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin-lesson-options"],
        }),
      ]);
    },
  });

  function handleToggleWord(word: VerifiedWord) {
    setSelectedWords((current) => {
      const exists = current.some(
        (item) => item.wordId === word.wordId
      );

      if (exists) {
        return current.filter(
          (item) => item.wordId !== word.wordId
        );
      }

      return [...current, word];
    });

    mutation.reset();
  }

  function handleRemoveWord(wordId: string) {
    setSelectedWords((current) =>
      current.filter((word) => word.wordId !== wordId)
    );

    mutation.reset();
  }

  function handleMoveWord(
    index: number,
    direction: -1 | 1
  ) {
    setSelectedWords((current) => {
      const targetIndex = index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current;
      }

      const updated = [...current];

      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];

      return updated;
    });

    mutation.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || selectedWords.length === 0) {
      return;
    }

    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      wordIds: selectedWords.map((word) => word.wordId),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <WordListDetails
        title={title}
        description={description}
        disabled={mutation.isPending}
        onTitleChange={(value) => {
          setTitle(value);
          mutation.reset();
        }}
        onDescriptionChange={setDescription}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <VerifiedWordPicker
          selectedWords={selectedWords}
          onToggle={handleToggleWord}
        />

        <div className="space-y-4 xl:sticky xl:top-6">
          <SelectedListWords
            words={selectedWords}
            onRemove={handleRemoveWord}
            onMove={handleMoveWord}
          />

          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Total selected
              </span>

              <span className="font-semibold text-gray-900">
                {selectedWords.length} words
              </span>
            </div>

            <button
              type="submit"
              disabled={
                mutation.isPending ||
                !title.trim() ||
                selectedWords.length === 0
              }
              className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutation.isPending
                ? "Creating word list..."
                : "Create word list"}
            </button>

            <p className="mt-2 text-center text-xs text-gray-500">
              {selectedWords.length === 0
                ? "Select at least one verified word."
                : `${selectedWords.length} words will be added in the selected order.`}
            </p>
          </div>

          {mutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {mutation.error.message}
            </div>
          )}

          {mutation.isSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Word list created successfully!
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
