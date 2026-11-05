
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/auth");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/auth");
  }

  if (!mounted || loading || !user) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <img
          src={
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.displayName || user.email || "User"
            )}&background=e4e4e7&color=18181b`
          }
          alt="Profile"
          referrerPolicy="no-referrer"
          className="h-24 w-24 rounded-full object-cover"
        />

        <h1 className="mt-5 text-xl font-semibold text-zinc-900">
          {user.displayName || "User"}
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          {user.email}
        </p>

        <button
          onClick={handleLogout}
          className="mt-8 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
