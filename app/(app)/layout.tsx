import Link from "next/link";

import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: resume } = await supabase
    .from("base_resumes")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar email={user.email ?? ""} resumeId={resume?.id ?? null} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar (sidebar is hidden below md) */}
        <header className="flex items-center justify-between border-b border-line bg-card px-4 py-3 md:hidden">
          <Link href="/dashboard" className="font-semibold text-brand-300">
            Resume Tailor
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted">
              Sign out
            </button>
          </form>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
