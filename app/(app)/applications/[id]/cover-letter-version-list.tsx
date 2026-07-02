"use client";

import { Button } from "@/components/ui";
import { coverLetterFileName } from "@/lib/pdf/filename";
import type { CoverLetterContent } from "@/lib/types";

export interface CoverLetterVersionItem {
  id: string;
  version: number;
  createdAt: string;
  content: CoverLetterContent;
}

export function CoverLetterVersionList({
  versions,
}: {
  versions: CoverLetterVersionItem[];
}) {
  async function download(content: CoverLetterContent) {
    const [{ pdf }, { CoverLetterDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/pdf/cover-letter-document"),
    ]);
    const blob = await pdf(<CoverLetterDocument content={content} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = coverLetterFileName(content.contact.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!versions.length) {
    return <p className="text-xs text-faint">No cover letters yet.</p>;
  }

  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {versions.map((v) => (
        <li key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="font-medium">Cover letter v{v.version}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => download(v.content)}
          >
            Download PDF
          </Button>
        </li>
      ))}
    </ul>
  );
}
