import { NewApplicationForm } from "./new-application-form";

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">New application</h1>
        <p className="text-sm text-gray-500">
          Paste the job description. We&apos;ll extract the key skills and score
          your resume against them.
        </p>
      </div>
      <NewApplicationForm />
    </div>
  );
}
