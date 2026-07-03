/**
 * Minimal line-level diff (LCS) for comparing resume versions — no dependency.
 * Operates on arrays of strings (bullets, skills, summary lines) and emits
 * side-by-side rows where a delete immediately followed by an insert is paired
 * into a single "mod" row (like a two-column diff view).
 */

export type DiffRowType = "same" | "mod" | "add" | "remove";

export interface DiffRow {
  type: DiffRowType;
  left?: string; // present for same | mod | remove
  right?: string; // present for same | mod | add
}

type Op = { type: "same" | "add" | "remove"; value: string };

function lcsOps(a: string[], b: string[]): Op[] {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a[i:] and b[j:]
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", value: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "remove", value: a[i] });
      i++;
    } else {
      ops.push({ type: "add", value: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "remove", value: a[i++] });
  while (j < m) ops.push({ type: "add", value: b[j++] });
  return ops;
}

/** Side-by-side rows: a remove directly followed by an add becomes one `mod`. */
export function diffRows(a: string[], b: string[]): DiffRow[] {
  const ops = lcsOps(a, b);
  const rows: DiffRow[] = [];
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    if (op.type === "same") {
      rows.push({ type: "same", left: op.value, right: op.value });
    } else if (op.type === "remove") {
      if (ops[k + 1]?.type === "add") {
        rows.push({ type: "mod", left: op.value, right: ops[k + 1].value });
        k++;
      } else {
        rows.push({ type: "remove", left: op.value });
      }
    } else {
      rows.push({ type: "add", right: op.value });
    }
  }
  return rows;
}

/** True when any row represents a change. */
export function hasChanges(rows: DiffRow[]): boolean {
  return rows.some((r) => r.type !== "same");
}
