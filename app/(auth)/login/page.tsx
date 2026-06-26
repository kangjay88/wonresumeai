"use client";

import { useActionState } from "react";

import { signIn, type AuthState } from "./actions";

export default function LoginPage() {
  const [signInState, signInAction, signingIn] = useActionState<
    AuthState,
    FormData
  >(signIn, null);

  const message = signInState?.error ?? null;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Resume Tailor</h1>
          <p className="text-sm text-gray-500">Sign in to your account.</p>
        </div>

        <form action={signInAction} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>

          {message ? (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={signingIn}
            className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
