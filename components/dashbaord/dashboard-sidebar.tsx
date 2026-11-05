
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "firebase/auth";
import {
  FiBookOpen,
  FiGrid,
  FiLogOut,
  FiX,
} from "react-icons/fi";

interface DashboardSidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const navigationLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: FiGrid,
  },
  {
    label: "Learn",
    href: "/dashboard/learn",
    icon: FiBookOpen,
  },
];

export default function DashboardSidebar({
  user,
  isOpen,
  onClose,
  onLogout,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const displayName = user.displayName || "User";

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=eeeef2&color=27272a`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-zinc-200/80 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[76px] items-center justify-between border-b border-zinc-100 px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <FiBookOpen className="h-5 w-5" />
            </div>

            <span className="text-lg font-bold tracking-tight">
              Vocab<span className="text-zinc-400">.</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 lg:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-8">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navigationLinks.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-[19px] w-[19px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-zinc-100 p-3">
          <div className="flex items-center gap-2 rounded-xl p-2">
            <Image
              src={user.photoURL || avatarFallback}
              alt="Profile"
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-800">
                {displayName}
              </p>

              <p className="truncate text-xs text-zinc-400">
                {user.email}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <FiLogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
