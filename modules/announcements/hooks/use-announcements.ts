"use client";

import { useState, useEffect } from "react";
import { listAnnouncements } from "@/modules/announcements/actions";
import type { UserRole } from "@/types";

/**
 * Shape expected by the Announcements widget in components/dashboard/widgets.tsx.
 */
export interface DashboardAnnouncement {
  id: string;
  title: string;
  /** Derived: first 150 chars of `body` */
  excerpt: string;
  /** Derived: formatted relative date from `published_at` or `created_at` */
  date: string;
  /**
   * Derived from `pinned`:
   *   pinned = true  → "important"
   *   pinned = false → "normal"
   */
  priority: "normal" | "important" | "urgent";
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Fetches published announcements visible to the given role.
 * Delegates to the `listAnnouncements` server action to avoid
 * browser-client session timing issues.
 *
 * Role-based filtering is applied client-side after fetch (RLS allows any
 * authenticated user to read published rows; target_roles is a UX filter).
 *
 * @param role   Current user's role (null while session is loading)
 * @param limit  Max announcements to return (default 3)
 */
export function useAnnouncements(role: UserRole | null, limit = 3) {
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        // Fetch extra rows so role-filtering still yields `limit` items
        const { rows, error: fetchError } = await listAnnouncements(limit * 3);

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        const visible = rows
          .filter((row) => {
            const targets = row.target_roles;
            return targets.length === 0 || targets.includes(role);
          })
          .slice(0, limit)
          .map((row): DashboardAnnouncement => ({
            id: row.id,
            title: row.title,
            excerpt:
              row.body.length > 150
                ? row.body.slice(0, 147).trimEnd() + "…"
                : row.body,
            date: formatRelativeDate(row.published_at ?? row.created_at),
            priority: row.pinned ? "important" : "normal",
          }));

        if (!cancelled) {
          setAnnouncements(visible);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar anuncios");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [role, limit]);

  return { announcements, isLoading, error };
}
