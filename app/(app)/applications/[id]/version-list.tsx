"use client";

import { resumeFileName } from "@/lib/pdf/filename";
import type { ResumeSections } from "@/lib/types";

export interface VersionItem {
  id: string;
  version: number;
  total: number | null;
  createdAt: string;
  sections: ResumeSections;
}

export function VersionList({ versions }: { versions: VersionItem[] }) {
  async function download(sections: ResumeSections) {
    const [{ pdf }, { ResumeDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/pdf/resume-document"),
    ]);
    const blob = await pdf(<ResumeDocument sections={sections} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resumeFileName(sections.contact.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!versions.length) {
    return (
      <p className="text-xs text-gray-400">
        No saved versions yet. Tailor and save to create version 1.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {versions.map((v) => (
        <li key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <div>
            <span className="font-medium">Version {v.version}</span>
            {v.total !== null ? (
              <span className="ml-2 text-gray-500">score {v.total}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => download(v.sections)}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50"
          >
            Download PDF
          </button>
        </li>
      ))}
    </ul>
  );
}
