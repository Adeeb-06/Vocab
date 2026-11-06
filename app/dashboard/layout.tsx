import { requirePageRole } from "@/lib/server-auth";
import DashboardClientLayout from "./dashboard-client-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole("user");

  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
