import type { ApplicationStatus } from "@/lib/supabase/types";

/** Pipeline order — the funnel, with rejected trailing as the exit stage. */
export const STAGES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
];

/** Per-status presentation. Status colors are intentional semantic hues
 *  (not brand tokens): badge = pill on the list, bar = pipeline meter. */
export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; badge: string; bar: string; text: string }
> = {
  saved: { label: "Saved", badge: "bg-white/10 text-muted", bar: "bg-white/30", text: "text-muted" },
  applied: { label: "Applied", badge: "bg-blue-500/15 text-blue-300", bar: "bg-blue-500", text: "text-blue-300" },
  interviewing: { label: "Interviewing", badge: "bg-amber-500/15 text-amber-300", bar: "bg-amber-500", text: "text-amber-300" },
  offer: { label: "Offer", badge: "bg-green-500/15 text-green-400", bar: "bg-green-500", text: "text-green-400" },
  accepted: { label: "Accepted", badge: "bg-emerald-500/15 text-emerald-400", bar: "bg-emerald-500", text: "text-emerald-400" },
  rejected: { label: "Rejected", badge: "bg-red-500/15 text-red-400", bar: "bg-red-500", text: "text-red-400" },
};
