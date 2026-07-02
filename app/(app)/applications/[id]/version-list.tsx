"use client";

import { Button } from "@/components/ui";
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
      <p className="text-xs text-faint">
        No saved versions yet. Tailor and save to create version 1.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {versions.map((v) => (
        <li key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <div>
            <span className="font-medium">Version {v.version}</span>
            {v.total !== null ? (
              <span className="ml-2 text-muted">score {v.total}</span>
            ) : null}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => download(v.sections)}
          >
            Download PDF
          </Button>
        </li>
      ))}
    </ul>
  );
}
