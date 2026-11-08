"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import DashboardSidebar from "@/components/dashbaord/dashboard-sidebar";
import { FiGrid } from "react-icons/fi";
import { LiaWordpressSimple } from "react-icons/lia";
import { PiExamFill } from "react-icons/pi";
import { ListChecks } from "lucide-react";

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
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
    try {
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not clear session.");
      }

      await signOut(auth);
      router.replace("/auth");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (loading || !user) {
    return null;
  }

  const displayName = user.displayName || "Admin";

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName,
  )}&background=eeeef2&color=27272a`;

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: FiGrid,
    },
    {
      label: "Words Review",
      href: "/admin/dashboard/words",
      icon: ListChecks,
    },
    {
      label: "Clozes Review",
      href: "/admin/dashboard/clozes",
      icon: ListChecks,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8fa] text-zinc-900">
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        links={links}
      />

      <div className="min-h-screen lg:pl-[200px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-zinc-200/70 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-lg border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-50 lg:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <p className="text-sm font-semibold">Admin Dashboard</p>
              <p className="hidden text-xs text-zinc-400 sm:block">
                Administration panel
              </p>
            </div>
          </div>

          <img
            src={user.photoURL || avatarFallback}
            alt="Profile"
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full border border-zinc-200 object-cover"
          />
        </header>

        <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-12 lg:px-1">
          {children}
        </main>
      </div>
    </div>
  );
}
