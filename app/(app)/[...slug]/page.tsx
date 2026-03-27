"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconClock } from "@/components/icons";

/**
 * Catch-all fallback for routes that haven't been implemented yet.
 * Renders within the (app) layout (sidebar + header) so navigation
 * remains functional. Replaced by real pages as sprints progress.
 *
 * Priority: lower than any explicit page.tsx, so existing routes
 * (/dashboard, /requests/*, /payroll/receipts) are unaffected.
 */
export default function ComingSoonPage() {
  const pathname = usePathname();

  const label = pathname
    .split("/")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
    .join(" · ");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <IconClock className="w-8 h-8 text-primary" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">En desarrollo</h2>
        <p className="text-sm text-muted-foreground">
          {label} estará disponible próximamente.
        </p>
      </div>

      <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-mono border border-border">
        {pathname}
      </p>

      <Link
        href="/dashboard"
        className="text-sm text-primary hover:underline"
      >
        ← Volver al Dashboard
      </Link>
    </div>
  );
}
