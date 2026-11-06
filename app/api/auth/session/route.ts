import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "__session";
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(request: NextRequest) {
  try {
    // Basic same-origin protection.
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (!origin || !host || new URL(origin).host !== host) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("idToken" in body) ||
      typeof body.idToken !== "string" ||
      !body.idToken.trim() ||
      body.idToken.length > 10_000
    ) {
      return NextResponse.json(
        { error: "A valid Firebase ID token is required." },
        { status: 400 }
      );
    }

    // Verify the Firebase identity.
    const decoded = await adminAuth.verifyIdToken(body.idToken);

    // Ensure the profile exists in MongoDB.
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found. Please sign in again." },
        { status: 403 }
      );
    }

    // Create an HTTP-only Firebase session cookie.
    const sessionCookie = await adminAuth.createSessionCookie(
      body.idToken,
      { expiresIn: SESSION_DURATION }
    );

    const response = NextResponse.json({
      success: true,
      role: user.role,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch (error) {
    console.error("Session creation failed:", error);

    return NextResponse.json(
      { error: "Could not create your session." },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}