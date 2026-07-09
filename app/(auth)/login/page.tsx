"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, Input } from "@/components/ui";

import { signIn, type AuthState } from "./actions";

export default function LoginPage() {
  const [signInState, signInAction, signingIn] = useActionState<
    AuthState,
    FormData
  >(signIn, null);

  const message = signInState?.error ?? null;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="reveal w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">
            <Link href="/" className="hover:text-brand-400">
              WonResume Ai
            </Link>
          </h1>
          <p className="text-sm text-muted">Sign in to your account.</p>
        </div>

        <form action={signInAction} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {message ? (
            <p className="text-sm text-red-400" role="alert">
              {message}
            </p>
          ) : null}

          <Button type="submit" fullWidth disabled={signingIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
