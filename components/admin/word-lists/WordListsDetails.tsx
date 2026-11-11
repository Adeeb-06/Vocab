
"use client";

type Props = {
  title: string;
  description: string;
  disabled: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export default function WordListDetails({
  title,
  description,
  disabled,
  onTitleChange,
  onDescriptionChange,
}: Props) {
  return (
    <section className="rounded-xl border bg-white p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-900">
          Word list details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Give your vocabulary collection a name and description.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="wordListTitle"
            className="text-sm font-medium text-gray-700"
          >
            Title
          </label>

          <input
            id="wordListTitle"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. University Admission Vocabulary"
            maxLength={100}
            disabled={disabled}
            required
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="wordListDescription"
            className="text-sm font-medium text-gray-700"
          >
            Description
            <span className="ml-1 font-normal text-gray-400">
              (optional)
            </span>
          </label>

          <textarea
            id="wordListDescription"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe what students will learn from this word list."
            rows={3}
            maxLength={500}
            disabled={disabled}
            className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:opacity-50"
          />
        </div>
      </div>
    </section>
  );
}
