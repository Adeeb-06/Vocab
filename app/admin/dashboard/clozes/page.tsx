
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ----------------------------------
// Types
// ----------------------------------

type Cloze = {
  id: string;
  pattern: string;
  prompt: string;
  answerText: string;
  acceptedAnswers: string[];
  explanation: string | null;
  difficultyLevel: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;

  word: {
    id: string;
    word: string;
    difficulty: number | null;
    isActive: boolean;
    isVerified: boolean;
  };

  sense: {
    id: string;
    partOfSpeech: string;
    meaningEn: string;
    meaningBn: string;
    synonyms: string[];
    antonyms: string[];
    collocations: string[];
  };

  example: {
    id: string;
    sentence: string;
  } | null;
};

type ApiResponse = {
  success: boolean;
  data: Cloze[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message?: string;
};

const LIMIT = 20;

const patternLabels: Record<string, string> = {
  sentence_blank: "Sentence blank",
  meaning_blank: "Meaning blank",
  first_letter: "First letter",
  multiple_choice: "Multiple choice",
  collocation_blank: "Collocation",
  synonym_blank: "Synonym",
};

// ----------------------------------
// API functions
// ----------------------------------

async function getClozes({
  page,
  status,
  token,
}: {
  page: number;
  status: string;
  token: string;
}): Promise<ApiResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
  });

  if (status === "pending") {
    params.set("isVerified", "false");
  }

  if (status === "verified") {
    params.set("isVerified", "true");
  }

  const response = await fetch(
    `/api/admin/words/clozes?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to fetch clozes"
    );
  }

  return result;
}

async function verifyCloze(clozeId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const token = await user.getIdToken();

  const response = await fetch(
    `/api/admin/words/clozes/${clozeId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isVerified: true,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Failed to verify cloze"
    );
  }

  return result;
}

// ----------------------------------
// Main page
// ----------------------------------

export default function ClozeReviewPage() {
  const queryClient = useQueryClient();

  const [userReady, setUserReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [pattern, setPattern] = useState("all");
  const [search, setSearch] = useState("");

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setUserReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Fetch clozes
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-clozes", page, status, auth.currentUser?.uid],

    queryFn: async () => {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Authentication required");
      }

      const token = await user.getIdToken();

      return getClozes({
        page,
        status,
        token,
      });
    },

    enabled: userReady && isAuthenticated,

    placeholderData: keepPreviousData,

    staleTime: 30 * 1000,
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: verifyCloze,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-clozes"],
      });
    },
  });

  // If the last item on a page was removed,
  // move back to the previous page.
  useEffect(() => {
    if (
      !isFetching &&
      data &&
      data.data.length === 0 &&
      page > 1
    ) {
      setPage((previous) => previous - 1);
    }
  }, [data, isFetching, page]);

  // Client-side search and pattern filtering
  const filteredClozes = useMemo(() => {
    const clozes = data?.data ?? [];
    const query = search.trim().toLowerCase();

    return clozes.filter((cloze) => {
      const matchesSearch =
        !query ||
        cloze.word.word.toLowerCase().includes(query) ||
        cloze.prompt.toLowerCase().includes(query) ||
        cloze.answerText.toLowerCase().includes(query) ||
        cloze.sense.meaningEn.toLowerCase().includes(query) ||
        cloze.sense.meaningBn.includes(query);

      const matchesPattern =
        pattern === "all" ||
        cloze.pattern === pattern;

      return matchesSearch && matchesPattern;
    });
  }, [data, search, pattern]);

  const clozes = data?.data ?? [];

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const pendingOnPage = clozes.filter(
    (cloze) => !cloze.isVerified
  ).length;

  const verifiedOnPage = clozes.filter(
    (cloze) => cloze.isVerified
  ).length;

  // ----------------------------------
  // Authentication states
  // ----------------------------------

  if (!userReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-gray-900">
            Authentication required
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Please log in to access cloze review.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------
  // Page UI
  // ----------------------------------

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Cloze Review
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review vocabulary questions and verify their accuracy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isFetching && !isLoading && (
              <span className="text-xs text-gray-400">
                Updating...
              </span>
            )}

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
              <span className="text-gray-500">
                Results{" "}
              </span>
              <span className="font-semibold">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total results"
            value={total}
          />

          <StatCard
            label="Pending on page"
            value={pendingOnPage}
          />

          <StatCard
            label="Verified on page"
            value={verifiedOnPage}
          />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_200px]">

            <input
              type="search"
              placeholder="Search word, meaning or question..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
            >
              <option value="pending">Pending review</option>
              <option value="verified">Verified</option>
              <option value="all">All clozes</option>
            </select>

            <select
              value={pattern}
              onChange={(event) =>
                setPattern(event.target.value)
              }
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
            >
              <option value="all">All patterns</option>

              {Object.entries(patternLabels).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredClozes.length} of {clozes.length} loaded
              questions
            </span>

            <button
              onClick={() => {
                setSearch("");
                setPattern("all");
                setStatus("pending");
                setPage(1);
              }}
              className="font-medium text-gray-700 hover:text-black"
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* Query error */}
        {isError && (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "Failed to load clozes"}
            </p>

            <button
              onClick={() => refetch()}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Mutation error */}
        {verifyMutation.isError && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {verifyMutation.error.message}
            </p>

            <button
              onClick={() => verifyMutation.reset()}
              className="text-sm font-medium text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        )}

        {/* Cards */}
        {!isLoading && !isError && filteredClozes.length > 0 && (
          <div className="space-y-4">
            {filteredClozes.map((cloze, index) => (
              <ClozeCard
                key={cloze.id}
                cloze={cloze}
                index={(page - 1) * LIMIT + index + 1}
                updating={
                  verifyMutation.isPending &&
                  verifyMutation.variables === cloze.id
                }
                onVerify={() => {
                  verifyMutation.mutate(cloze.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading &&
          !isError &&
          filteredClozes.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <p className="font-medium text-gray-800">
                No clozes found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() =>
                  setPage((previous) => previous - 1)
                }
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={page >= totalPages || isFetching}
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ----------------------------------
// Statistics card
// ----------------------------------

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ----------------------------------
// Cloze card
// ----------------------------------

function ClozeCard({
  cloze,
  index,
  updating,
  onVerify,
}: {
  cloze: Cloze;
  index: number;
  updating: boolean;
  onVerify: () => void;
}) {
  const verified = cloze.isVerified;

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            #{String(index).padStart(3, "0")}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              verified
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {verified ? "Verified" : "Pending review"}
          </span>

          {!cloze.isActive && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
              Inactive
            </span>
          )}
        </div>

        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {patternLabels[cloze.pattern] || cloze.pattern}
        </span>
      </div>

      <div className="space-y-5 p-4 sm:p-5">

        {/* Word context */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {cloze.word.word}
            </h2>

            <span className="text-xs text-gray-400">
              {cloze.sense.partOfSpeech}
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            {cloze.sense.meaningEn}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {cloze.sense.meaningBn}
          </p>
        </div>

        {/* Question */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Question
          </p>

          <p className="text-sm leading-7 text-gray-800 sm:text-base">
            {cloze.prompt}
          </p>
        </div>

        {/* Visible answer */}
        <div className="rounded-lg border border-green-100 bg-green-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-green-700">
            Correct answer
          </p>

          <p className="text-base font-semibold text-green-800">
            {cloze.answerText}
          </p>

          {cloze.acceptedAnswers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {cloze.acceptedAnswers.map((answer, index) => (
                <span
                  key={`${answer}-${index}`}
                  className="rounded-md border border-green-200 bg-white px-2 py-1 text-xs text-green-800"
                >
                  {answer}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Explanation */}
        {cloze.explanation && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Explanation
            </p>

            <p className="text-sm leading-relaxed text-gray-600">
              {cloze.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              Difficulty: {cloze.difficultyLevel}/5
            </span>

            <span>•</span>

            <span>
              {new Date(cloze.createdAt).toLocaleDateString()}
            </span>
          </div>

          {!verified ? (
            <button
              onClick={onVerify}
              disabled={updating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Verify cloze
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Additional information */}
        <details className="group border-t border-gray-100 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium text-gray-600 hover:text-gray-900">
            More details

            <span className="transition group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="mt-4 space-y-4 text-sm">

            {cloze.example && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-gray-400">
                  Original example
                </p>

                <p className="leading-relaxed text-gray-700">
                  {cloze.example.sentence}
                </p>
              </div>
            )}

            <DetailList
              label="Synonyms"
              values={cloze.sense.synonyms}
            />

            <DetailList
              label="Antonyms"
              values={cloze.sense.antonyms}
            />

            <DetailList
              label="Collocations"
              values={cloze.sense.collocations}
            />

            <div className="grid gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
              <IdField label="Word ID" value={cloze.word.id} />
              <IdField label="Sense ID" value={cloze.sense.id} />
              <IdField label="Cloze ID" value={cloze.id} />
            </div>

          </div>
        </details>

      </div>
    </article>
  );
}

// ----------------------------------
// Reusable components
// ----------------------------------

function DetailList({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  if (!values.length) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function IdField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 break-all text-xs text-gray-600">
        {value}
      </p>
    </div>
  );
}
