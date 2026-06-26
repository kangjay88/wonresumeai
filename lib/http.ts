import { NextResponse } from "next/server";

/**
 * Cheap CSRF defense for state-changing / paid API routes. Browsers attach
 * `Sec-Fetch-Site`; a forged cross-site request (e.g. a malicious page POSTing
 * to our AI endpoints using the user's cookie) arrives as "cross-site". We
 * allow same-origin/same-site and direct navigations ("none"), and block the
 * rest. Returns a 403 response to short-circuit, or null to proceed.
 *
 * Server Actions already get Next's built-in CSRF protection; this covers the
 * Route Handlers that spend Anthropic credits.
 */
export function blockCrossSite(request: Request): NextResponse | null {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }
  return null;
}
