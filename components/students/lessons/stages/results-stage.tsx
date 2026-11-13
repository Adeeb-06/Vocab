"use client";

import { FiCheckCircle, FiClock, FiTarget } from "react-icons/fi";

interface Props {
  totalWords: number;
  knownWords: number;
  recallCorrect: number;
  recallTotal: number;
  practiceCorrect: number;
  practiceTotal: number;
  clozeCorrect: number;
  clozeTotal: number;
  saving: boolean;
  onFinish: () => void;
}

export default function ResultsStage({
  totalWords,
  knownWords,
  recallCorrect,
  recallTotal,
  practiceCorrect,
  practiceTotal,
  clozeCorrect,
  clozeTotal,
  saving,
  onFinish,
}: Props) {
  const correct = recallCorrect + practiceCorrect + clozeCorrect;
  const attempted = recallTotal + practiceTotal + clozeTotal;
  const score = attempted
    ? Math.round((correct / attempted) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <FiCheckCircle size={32} />
        </div>

        <p className="mt-5 text-sm font-semibold text-violet-600">
          LESSON COMPLETED
        </p>

        <h1 className="mt-2 text-3xl font-bold text-zinc-900">
          Good work!
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          You've finished all the activities in this lesson.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <FiTarget className="text-violet-600" size={20} />
          <p className="mt-4 text-2xl font-bold text-zinc-900">
            {score}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">Practice accuracy</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <FiCheckCircle className="text-emerald-600" size={20} />
          <p className="mt-4 text-2xl font-bold text-zinc-900">
            {knownWords}/{totalWords}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Initially known</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 sm:col-span-1">
          <FiClock className="text-amber-600" size={20} />
          <p className="mt-4 text-2xl font-bold text-zinc-900">
            {attempted}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Questions answered</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">Your performance</h2>

        {[
          ["Immediate recall", recallCorrect, recallTotal],
          ["Mixed practice", practiceCorrect, practiceTotal],
          ["Cloze challenge", clozeCorrect, clozeTotal],
        ].map(([label, value, total]) => (
          <div key={String(label)} className="mt-5">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">{label}</span>
              <span className="font-medium text-zinc-900">
                {value}/{total}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-violet-600"
                style={{
                  width: `${Number(total) ? (Number(value) / Number(total)) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onFinish}
        disabled={saving}
        className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? "Saving your progress..." : "Complete lesson"}
      </button>
    </div>
  );
}