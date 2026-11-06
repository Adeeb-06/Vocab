import WordsTable from "../../../../components/admin/words/WordsTable";

export default function WordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Words
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage, review and verify your vocabulary database.
        </p>
      </div>

      <WordsTable />
    </div>
  );
}

export const instant = false