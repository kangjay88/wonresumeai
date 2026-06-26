"use client";

import { PDFViewer } from "@react-pdf/renderer";

import { ResumeDocument } from "@/lib/pdf/resume-document";
import type { ResumeSections } from "@/lib/types";

/**
 * Live PDF preview. Imported via next/dynamic with ssr:false from the builder,
 * because <PDFViewer> renders an iframe + Blob URL that only work in the
 * browser. The document it renders is the exact one we download.
 */
export default function PdfPreview({ sections }: { sections: ResumeSections }) {
  return (
    <PDFViewer
      showToolbar={false}
      style={{ width: "100%", height: "100%", border: "none" }}
    >
      <ResumeDocument sections={sections} />
    </PDFViewer>
  );
}
