
import type { User as FirebaseUser } from "firebase/auth";

export async function syncUserProfile(
  firebaseUser: FirebaseUser,
  name?: string
) {
  const idToken = await firebaseUser.getIdToken();

  const response = await fetch("/api/users/me", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(name ? { name } : {}),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "We couldn't save your user profile."
    );
  }

  return result.user;
}
