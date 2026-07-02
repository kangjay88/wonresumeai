"use client";

import { useActionState } from "react";

import { Button, Input, Textarea } from "@/components/ui";

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
          <Input name="company" required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Role title</span>
          <Input name="role_title" required />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-sm font-medium">Job description</span>
        <Textarea
          name="job_description"
          required
          rows={14}
          placeholder="Paste the full job description here…"
        />
      </label>

      {state && !state.ok ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Extracting & scoring…" : "Create application"}
      </Button>
    </form>
  );
}
