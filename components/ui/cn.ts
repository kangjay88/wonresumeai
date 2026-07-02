/** Minimal class joiner — filters falsy values and joins with spaces.
 *  Matches the project's template-literal className convention without
 *  pulling in clsx/tailwind-merge. */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
