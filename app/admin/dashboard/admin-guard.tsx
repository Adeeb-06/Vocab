// app/admin/dashboard/admin-guard.tsx
import { connection } from "next/server";
import { requirePageRole } from "@/lib/server-auth";

export async function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  await requirePageRole("admin");   // still redirects if not admin
  return <>{children}</>;
}