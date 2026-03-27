"use client";

import { useState, useEffect, useCallback } from "react";
import { listAnnouncementsBoard } from "@/modules/announcements/actions";
import type { UserRole } from "@/types";
import type { UserRoleEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BoardAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string;
  /** Empty array = visible to all roles */
  targetRoles: UserRoleEnum[];
  pinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  // NEW: Media & priority support
  priority?: "normal" | "important" | "urgent";
  featured_image_url?: string;
  featured_image_alt?: string;
  media?: Array<{
    id: string;
    type: "image" | "video";
    url: string;
    alt?: string;
    thumbnail_url?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches the full list of published, non-expired announcements for the
 * announcements board page (TASK-017).
 *
 * Delegates to the `listAnnouncementsBoard` server action to avoid
 * browser-client session timing issues.
 *
 * `target_roles` audience filtering is still applied client-side:
 * empty array → visible to all; non-empty → only matching roles.
 */
export function useAnnouncementsBoard(userRole: UserRole | null) {
  const [announcements, setAnnouncements] = useState<BoardAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (userRole === null) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { rows, error: fetchError } = await listAnnouncementsBoard();

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        const visible = rows
          .map((row): BoardAnnouncement => ({
            id: row.id,
            title: row.title,
            body: row.body,
            category: row.category,
            targetRoles: row.target_roles as UserRoleEnum[],
            pinned: row.pinned,
            publishedAt: (row.published_at ?? row.created_at) as string,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
          }))
          .filter(
            (a) =>
              a.targetRoles.length === 0 ||
              a.targetRoles.includes(userRole as UserRoleEnum),
          );

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
  }, [userRole, version]);

  return { announcements, isLoading, error, refetch };
}
