import { Suspense } from "react";
import AdminClientLayout from "./admin-client-layout";
import { AdminGuard } from "./admin-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8 text-sm text-zinc-500">
          Loading dashboard...
        </div>
      }
    >
      <AdminClientLayout>
        <AdminGuard>{children}</AdminGuard>
      </AdminClientLayout>
    </Suspense>
  );
}