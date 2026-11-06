import { connection } from "next/server";
import { requirePageRole } from "@/lib/server-auth";
import AdminClientLayout from "./admin-client-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prevent prerendering before checking the current request.
  await connection();

  // Only admins can access this dashboard.
  await requirePageRole("admin");

  return <AdminClientLayout>{children}</AdminClientLayout>;
}