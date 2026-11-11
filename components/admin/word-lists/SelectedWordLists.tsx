
"use client";

import type { VerifiedWord } from "@/lib/admin/word-list";

type Props = {
  words: VerifiedWord[];
  onRemove: (wordId: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

export default function SelectedListWords({
  words,
  onRemove,
  onMove,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="border-b p-5">
        <h2 className="font-semibold text-gray-900">
          Selected words
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Arrange the vocabulary in your preferred order.
        </p>
      </div>

      {words.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          Select words to build your list.
        </div>
      ) : (
        <div className="divide-y">
          {words.map((word, index) => (
            <div
              key={word.wordId}
              className="flex items-center gap-3 px-5 py-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {word.word}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {word.senses[0]?.meaningEn || "No meaning"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                  aria-label={`Move ${word.word} up`}
                  className="rounded-md border px-2 py-1.5 text-xs disabled:opacity-30"
                >
                  ↑
                </button>

                <button
                  type="button"
                  disabled={index === words.length - 1}
                  onClick={() => onMove(index, 1)}
                  aria-label={`Move ${word.word} down`}
                  className="rounded-md border px-2 py-1.5 text-xs disabled:opacity-30"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(word.wordId)}
                  className="rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
