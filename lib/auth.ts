import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

type AppUser = NonNullable<
  Awaited<ReturnType<typeof prisma.user.findUnique>>
>;

type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; response: NextResponse };

export async function requireAuth(
  request: NextRequest
): Promise<AuthResult> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const idToken = authorization.slice(7).trim();

  if (!idToken || idToken.length > 10_000) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid authentication token." },
        { status: 401 }
      ),
    };
  }

  let decoded;

  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      firebaseUid: decoded.uid,
    },
  });

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "User profile not found. Please sign in again." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

export async function requireRole(
  request: NextRequest,
  allowedRole: "admin" | "user"
): Promise<AuthResult> {
  const auth = await requireAuth(request);

  if (!auth.ok) {
    return auth;
  }

  if (auth.user.role !== allowedRole) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You are not authorized to access this resource." },
        { status: 403 }
      ),
    };
  }

  return auth;
}