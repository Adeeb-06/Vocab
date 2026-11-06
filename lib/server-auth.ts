import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "__session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    const user = await prisma.user.findUnique({
      where: {
        firebaseUid: decoded.uid,
      },
      select: {
        id: true,
        firebaseUid: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function requirePageRole(role: "admin" | "user") {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== role) {
    redirect(
      user.role === "admin"
        ? "/admin/dashboard"
        : "/dashboard"
    );
  }

  return user;
}

export async function getDashboardPath() {
  const user = await getCurrentUser();

  if (!user) {
    return "/login";
  }

  return user.role === "admin"
    ? "/admin/dashboard"
    : "/dashboard";
}