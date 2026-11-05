"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncUserProfile } from "@/lib/sync-user-profile";

type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

type AuthMode = "signup" | "login";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    shouldUnregister: true,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isSignup = mode === "signup";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    clearErrors();
    reset();
  }

  const router = useRouter();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  function getAuthErrorMessage(error: unknown) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "";

    switch (code) {
      case "auth/email-already-in-use":
        return "An account already exists with this email. Try logging in.";
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Please choose a stronger password.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Your browser blocked the Google sign-in popup.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled in Firebase.";
      case "auth/network-request-failed":
        return "Network error. Check your internet connection.";
      default:
        return error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    }
  }

  async function onSubmit(data: AuthFormValues) {
    setMessage("");

    try {
      let firebaseUser: FirebaseUser;

      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          data.email.trim(),
          data.password,
        );

        firebaseUser = credential.user;

        await updateProfile(firebaseUser, {
          displayName: data.name?.trim() || "",
        });
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          data.email.trim(),
          data.password,
        );

        firebaseUser = credential.user;
      }

      await syncUserProfile(
        firebaseUser,
        mode === "signup" ? data.name?.trim() : undefined,
      );

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Authentication failed:", error);
      setMessage(getAuthErrorMessage(error));
    }
  }

  async function handleGoogleSignIn() {
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);

      await syncUserProfile(credential.user);

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Google sign-in failed:", error);
      setMessage(getAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5";

  const errorClass = "mt-1.5 text-xs text-red-600";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4 py-10 text-zinc-900">
      <section className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
            R
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Retain your words.
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Build a vocabulary that stays with you.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          {/* Mode switch */}
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isSignup
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Create account
            </button>

            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                !isSignup
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Log in
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {isSignup ? "Get started for free" : "Welcome back"}
            </h2>

            <p className="mt-1.5 text-sm text-zinc-500">
              {isSignup
                ? "Create your account and start learning."
                : "Pick up where your learning left off."}
            </p>
          </div>

          {/* Google button: UI only */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                transform="translate(0 4)"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.72 5.99c4.51-4.17 7.08-10.31 7.08-17.64Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.12.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                transform="translate(0 4)"
              />
              <path
                fill="#34A853"
                d="M24 48c6.47 0 11.92-2.13 15.9-5.81l-7.72-5.99c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
              />
            </svg>

            {isGoogleLoading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-400">OR WITH EMAIL</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            {isSignup && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Your name
                </label>

                <input
                  id="name"
                  autoComplete="name"
                  placeholder="Enter your name"
                  className={inputClass}
                  {...register("name", {
                    required: isSignup ? "Please enter your name." : false,
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters.",
                    },
                  })}
                  aria-invalid={Boolean(errors.name)}
                />

                {errors.name && (
                  <p className={errorClass} role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                {...register("email", {
                  required: "Please enter your email.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address.",
                  },
                })}
                aria-invalid={Boolean(errors.email)}
              />

              {errors.email && (
                <p className={errorClass} role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="At least 8 characters"
                  className={`${inputClass} pr-16`}
                  {...register("password", {
                    required: "Please enter your password.",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters.",
                    },
                  })}
                  aria-invalid={Boolean(errors.password)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 text-xs font-medium text-zinc-500 hover:text-zinc-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p className={errorClass} role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {isSignup && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={inputClass}
                  {...register("confirmPassword", {
                    required: "Please confirm your password.",
                    validate: (value) =>
                      value === getValues("password") ||
                      "Passwords do not match.",
                  })}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />

                {errors.confirmPassword && (
                  <p className={errorClass} role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            {!isSignup && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setMessage("Password reset will be added later.")
                  }
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-950"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSignup ? "Create account" : "Log in"}
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </button>
          </form>

          {message && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600"
            >
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="text-zinc-700 underline underline-offset-2"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-zinc-700 underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Make every word count.
        </p>
      </section>
    </main>
  );
}
