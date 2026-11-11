
import CreateWordListForm from "@/components/admin/word-lists/CreateWordLists";

export default function CreateWordListPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-medium text-gray-500">
          Admin / Word Lists
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Create word list
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Build a vocabulary collection using your verified word bank.
        </p>
      </div>

      <CreateWordListForm />
    </div>
  );
}
