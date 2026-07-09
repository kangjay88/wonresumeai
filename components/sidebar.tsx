"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/(auth)/login/actions";

type IconProps = { className?: string };

function GridIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function DocIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function MemoryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

function SignOutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function Sidebar({
  email,
  resumeId,
}: {
  email: string;
  resumeId: string | null;
}) {
  const pathname = usePathname();

  const items = [
    {
      href: "/dashboard",
      label: "Applications",
      Icon: GridIcon,
      active: pathname.startsWith("/dashboard") || pathname.startsWith("/applications"),
    },
    ...(resumeId
      ? [
          {
            href: `/resume/${resumeId}`,
            label: "Resume",
            Icon: DocIcon,
            active: pathname.startsWith("/resume"),
          },
        ]
      : []),
    {
      href: "/onboarding",
      label: "Career memory",
      Icon: MemoryIcon,
      active: pathname.startsWith("/onboarding"),
    },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-card md:sticky md:top-0 md:flex md:h-screen">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="text-lg font-semibold text-brand-300">
          WonResume Ai
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ href, label, Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-500/15 text-brand-300"
                : "text-muted hover:bg-white/5 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <p className="truncate px-2 pb-1 text-xs text-faint">{email}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-ink"
          >
            <SignOutIcon className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
