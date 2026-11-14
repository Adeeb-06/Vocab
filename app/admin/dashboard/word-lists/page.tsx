
"use client";

import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  BookOpen,
  Layers,
} from "lucide-react";

import CreateWordListForm from "@/components/admin/word-lists/CreateWordLists";

import {
  fetchWordLists,
  fetchWordList,
  updateWordList,
  deleteWordList,
  type VerifiedWord,
} from "@/lib/admin/word-list";

import WordListDetails from "@/components/admin/word-lists/WordListsDetails";
import VerifiedWordPicker from "@/components/admin/word-lists/VerifiedWordPicker";
import SelectedListWords from "@/components/admin/word-lists/SelectedWordLists";

export default function WordListsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWords, setSelectedWords] = useState<VerifiedWord[]>([]);

  const listsQuery = useQuery({
    queryKey: ["admin-word-lists", search],
    queryFn: () => fetchWordLists(search),
  });

  const editQuery = useQuery({
    queryKey: ["admin-word-list", editingId],
    queryFn: () => fetchWordList(editingId!),
    enabled: !!editingId,
  });

  useEffect(() => {
    const list = editQuery.data?.wordList;

    if (!list) return;

    setTitle(list.title);
    setDescription(list.description ?? "");
    setSelectedWords(
      list.items.map((item) => ({
        wordId: item.wordId,
        word: item.word,
        difficulty: item.difficulty,
        senses: item.senses,
      }))
    );
  }, [editQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateWordList,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-word-lists"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin-lesson-options"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin-word-list", editingId],
        }),
      ]);

      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWordList,
    onSuccess: async () => {
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

  function closeModal() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSelectedWords([]);
    updateMutation.reset();
  }

  function handleToggleWord(word: VerifiedWord) {
    setSelectedWords((current) => {
      const exists = current.some(
        (item) => item.wordId === word.wordId
      );

      return exists
        ? current.filter((item) => item.wordId !== word.wordId)
        : [...current, word];
    });

    updateMutation.reset();
  }

  function handleRemoveWord(wordId: string) {
    setSelectedWords((current) =>
      current.filter((word) => word.wordId !== wordId)
    );

    updateMutation.reset();
  }

  function handleMoveWord(index: number, direction: -1 | 1) {
    setSelectedWords((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const updated = [...current];

      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];

      return updated;
    });

    updateMutation.reset();
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId || !title.trim() || selectedWords.length === 0) {
      return;
    }

    updateMutation.mutate({
      id: editingId,
      title: title.trim(),
      description: description.trim(),
      wordIds: selectedWords.map((word) => word.wordId),
    });
  }

  function handleDelete(id: string, listTitle: string) {
    const confirmed = window.confirm(
      `Permanently delete "${listTitle}"?\n\nThis will also delete its lessons, student lesson progress, and answer history. The actual vocabulary words will remain.\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  }

  const wordLists = listsQuery.data?.wordLists ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Word Lists
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create, update, and manage your vocabulary word lists.
        </p>
      </div>

      {/* Create word list */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Create a word list
        </h2>

        <CreateWordListForm />
      </section>

      {/* Existing word lists */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Existing word lists
            </h2>
            <p className="text-sm text-gray-500">
              {wordLists.length} lists found
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search word lists..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {listsQuery.isLoading && (
          <div className="flex items-center justify-center rounded-xl border bg-white py-12 text-sm text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Loading word lists...
          </div>
        )}

        {listsQuery.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {listsQuery.error.message}
            <button
              onClick={() => listsQuery.refetch()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!listsQuery.isLoading &&
          !listsQuery.isError &&
          wordLists.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
              <Layers className="mx-auto mb-3 text-gray-400" size={28} />
              <p className="font-medium text-gray-700">
                No word lists found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Create your first word list above.
              </p>
            </div>
          )}

        <div className="grid gap-4">
          {wordLists.map((list) => (
            <div
              key={list.id}
              className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">
                    {list.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    /{list.slug}
                  </p>

                  {list.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {list.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={14} />
                      {list.wordCount} words
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Layers size={14} />
                      {list.lessonCount} lessons
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => {
                      updateMutation.reset();
                      setEditingId(list.id);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Pencil size={15} />
                    Update
                  </button>

                  <button
                    onClick={() => handleDelete(list.id, list.title)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>

              {deleteMutation.isError && (
                <p className="mt-3 text-sm text-red-600">
                  {deleteMutation.error.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Update modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Update word list
                </h2>
                <p className="text-xs text-gray-500">
                  Edit details, add words, remove words, or change their order.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={updateMutation.isPending}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {editQuery.isLoading && (
                <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Loading word list...
                </div>
              )}

              {editQuery.isError && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {editQuery.error.message}
                  <button
                    onClick={() => editQuery.refetch()}
                    className="ml-2 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {editQuery.data && (
                <form onSubmit={handleUpdate} className="space-y-5">
                  <WordListDetails
                    title={title}
                    description={description}
                    disabled={updateMutation.isPending}
                    onTitleChange={(value) => {
                      setTitle(value);
                      updateMutation.reset();
                    }}
                    onDescriptionChange={setDescription}
                  />

                  <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <VerifiedWordPicker
                      selectedWords={selectedWords}
                      onToggle={handleToggleWord}
                    />

                    <div className="space-y-4 xl:sticky xl:top-0">
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
                            updateMutation.isPending ||
                            !title.trim() ||
                            selectedWords.length === 0
                          }
                          className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {updateMutation.isPending
                            ? "Saving changes..."
                            : "Save changes"}
                        </button>

                        {updateMutation.isError && (
                          <p className="mt-3 text-sm text-red-600">
                            {updateMutation.error.message}
                          </p>
                        )}

                        <p className="mt-2 text-center text-xs text-gray-500">
                          Changes will be saved in the selected word order.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
