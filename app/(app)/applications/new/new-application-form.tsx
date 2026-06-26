"use client";

import { useActionState } from "react";

import { createApplication, type CreateResult } from "../actions";

export function NewApplicationForm() {
  const [state, action, pending] = useActionState<CreateResult | null, FormData>(
    createApplication,
    null
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Company</span>
          <input
            name="company"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Role title</span>
          <input
            name="role_title"
            required
            className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-sm font-medium">Job description</span>
        <textarea
          name="job_description"
          required
          rows={14}
          placeholder="Paste the full job description here…"
          className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>

      {state && !state.ok ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Extracting & scoring…" : "Create application"}
      </button>
    </form>
  );
}
