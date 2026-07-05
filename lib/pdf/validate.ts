import type { getDocumentProxy } from "unpdf";

/**
 * Heuristic checks on a parsed PDF so imported resumes score honestly instead
 * of being assumed clean. These produce *warnings*, not hard failures — the
 * signals are probabilistic, so we flag likely-bad extractions and let the user
 * review the parsed sections rather than silently trusting them.
 *
 *  - Scanned / image PDFs: little selectable text relative to page count.
 *  - Multi-column layouts: pdf.js reads in document order, which interleaves
 *    columns, so a consistent empty vertical gutter is a red flag.
 */

type PdfProxy = Awaited<ReturnType<typeof getDocumentProxy>>;

interface TextItemLike {
  str: string;
  transform: number[]; // [a, b, c, d, x, y]
  width: number;
}

export interface PdfValidation {
  pages: number;
  chars: number;
  warnings: string[];
}

/** Below this, the page is likely a scan or mostly graphical. */
const MIN_CHARS_PER_PAGE = 150;
/** Share of inspected pages that must look two-column to warn. */
const TWO_COLUMN_PAGE_RATIO = 0.5;
/** Only inspect the first few pages — resumes are short, and this bounds cost. */
const MAX_PAGES_INSPECTED = 5;

export async function validatePdfExtraction(
  pdf: PdfProxy,
  text: string,
): Promise<PdfValidation> {
  const pages = pdf.numPages;
  const chars = text.length;
  const warnings: string[] = [];

  if (chars / Math.max(1, pages) < MIN_CHARS_PER_PAGE) {
    warnings.push(
      "This PDF has very little selectable text. If it's a scan or image, the parsed resume may be incomplete — an exported text-based PDF works best.",
    );
  }

  let twoColumnPages = 0;
  const toInspect = Math.min(pages, MAX_PAGES_INSPECTED);
  for (let p = 1; p <= toInspect; p++) {
    try {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const view = page.view as number[]; // [x0, y0, x1, y1]
      const width = view[2] - view[0];
      if (width > 0 && looksTwoColumn(content.items as TextItemLike[], view[0], width)) {
        twoColumnPages++;
      }
    } catch {
      // Page-level failures shouldn't sink the whole validation.
    }
  }
  if (toInspect > 0 && twoColumnPages / toInspect >= TWO_COLUMN_PAGE_RATIO) {
    warnings.push(
      "This looks like a multi-column layout. Text may have been read out of order, so double-check the parsed sections below.",
    );
  }

  return { pages, chars, warnings };
}

/**
 * True when the page's text has a clear empty vertical gutter in its central
 * region with substantial text on both sides — the signature of two columns.
 * A single right-aligned date column won't trip it: that side stays well under
 * the 25% share we require.
 */
function looksTwoColumn(
  items: TextItemLike[],
  x0: number,
  width: number,
): boolean {
  const centers: number[] = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const cx = (it.transform[4] - x0 + it.width / 2) / width; // normalized 0..1
    if (cx >= 0 && cx <= 1) centers.push(cx);
  }
  if (centers.length < 20) return false; // too little text to judge

  const BINS = 20;
  const hist = new Array<number>(BINS).fill(0);
  for (const c of centers) {
    hist[Math.min(BINS - 1, Math.floor(c * BINS))]++;
  }

  const total = centers.length;
  // Scan candidate gutter bins across the central 30%–65% of the page.
  for (let g = 6; g <= 13; g++) {
    if (hist[g] / total > 0.02) continue; // gutter must be near-empty
    const left = hist.slice(0, g).reduce((a, b) => a + b, 0);
    const right = hist.slice(g + 1).reduce((a, b) => a + b, 0);
    if (left / total >= 0.25 && right / total >= 0.25) return true;
  }
  return false;
}
