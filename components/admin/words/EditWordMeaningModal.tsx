"use client";

import { useState } from "react";

type Props = {
  word: string;
  meaningEn: string;
  meaningBn: string;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (meaningEn: string, meaningBn: string) => void;
};

export default function EditWordMeaningModal({
  word,
  meaningEn: initialEn,
  meaningBn: initialBn,
  isSaving,
  error,
  onClose,
  onSave,
}: Props) {
  const [meaningEn, setMeaningEn] = useState(initialEn);
  const [meaningBn, setMeaningBn] = useState(initialBn);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(meaningEn, meaningBn);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow-xl"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Edit meaning
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the meanings for{" "}
            <span className="font-semibold text-gray-900">{word}</span>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            English meaning
          </label>

          <textarea
            value={meaningEn}
            onChange={(e) => setMeaningEn(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border p-3 text-sm outline-none focus:border-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Bangla meaning
          </label>

          <textarea
            value={meaningBn}
            onChange={(e) => setMeaningBn(e.target.value)}
            rows={2}
            required
            className="w-full rounded-lg border p-3 text-sm outline-none focus:border-gray-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSaving ||
              !meaningEn.trim() ||
              !meaningBn.trim()
            }
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}