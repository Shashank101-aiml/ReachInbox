"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/useUser";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Google didn't return an authorization code. Please try again.",
  oauth_failed: "Sign-in with Google failed. Please try again.",
};

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();
  const [notice, setNotice] = useState<string | null>(null);
  const error = searchParams.get("error");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-gray-900">Login</h1>

      {(error || notice) && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {notice ?? ERROR_MESSAGES[error!] ?? "Something went wrong. Please try again."}
        </p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => {
          // Full-page navigation to the backend (different origin) to start
          // the OAuth redirect — not an internal Next.js route.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = `${API_URL}/api/auth/google`;
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-50 py-2.5 text-sm font-medium text-gray-800 hover:bg-emerald-100 disabled:opacity-60"
      >
        <GoogleIcon className="h-4 w-4" />
        {loading ? "Checking session…" : "Login with Google"}
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or sign up through email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setNotice("Email/password login isn't available in this demo — please use Google.");
        }}
      >
        <input
          type="email"
          placeholder="Email ID"
          className="w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Login
        </button>
      </form>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z"
      />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </div>
  );
}
