import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const idToken = authorization.slice("Bearer ".length).trim();

    if (!idToken || idToken.length > 10_000) {
      return NextResponse.json(
        { error: "Invalid authentication token." },
        { status: 401 },
      );
    }

    // Verify signature, expiry, issuer and audience with Firebase.
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (!decoded.uid || !decoded.email) {
      return NextResponse.json(
        { error: "Your Firebase account must have an email address." },
        { status: 400 },
      );
    }

    // Only accept a display name from the request body.
    // Identity fields come from the verified Firebase token.
    let requestedName: string | undefined;

    try {
      const body: unknown = await request.json();

      if (
        typeof body === "object" &&
        body !== null &&
        "name" in body &&
        typeof body.name === "string"
      ) {
        const name = body.name.trim();

        if (name.length > 100) {
          return NextResponse.json(
            { error: "Name must be 100 characters or fewer." },
            { status: 400 },
          );
        }

        if (name.length > 0) {
          requestedName = name;
        }
      }
    } catch {
      // An empty body is allowed for login and Google sign-in.
    }

    const email = decoded.email.toLowerCase();
    const name =
      requestedName ||
      (typeof decoded.name === "string" ? decoded.name.trim() : "") ||
      email.split("@")[0];

    const image = typeof decoded.picture === "string" ? decoded.picture : null;

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        firebaseUid: decoded.uid,
        email,
        name,
        image,
      },
      update: {
        email,
        ...(requestedName ? { name: requestedName } : {}),
        ...(image ? { image } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      error.code.startsWith("auth/")
    ) {
      return NextResponse.json(
        { error: "Your session is invalid or expired. Please sign in again." },
        { status: 401 },
      );
    }

    console.error("Profile sync failed:", error);

    return NextResponse.json(
      { error: "Could not save your profile. Please try again." },
      { status: 500 },
    );
  }
}
