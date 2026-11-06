
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";


export default function DashboardPage() {
  return (
    <>
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          ADMIN
        </p>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome to your dashboard.
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Manage your account and continue your learning journey.
        </p>
      </div>

      {/* Dashboard content goes here */}
    </>
  );
}
