"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRoleEnum, PublishStatusEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Full announcement row — used by the HR management page (TASK-024). */
export interface HRAnnouncement {
  id: string;
  authorId: string;
  title: string;
  body: string;
  category: string;
  targetRoles: UserRoleEnum[];
  pinned: boolean;
  status: PublishStatusEnum;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HRAnnouncementFilters {
  /** Server-side: DB status. Empty = all. */
  status: "" | "draft" | "published" | "archived";
  /** Client-side: match against announcement title */
  search: string;
  /** Client-side: match against category */
  category: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches ALL announcements (draft + published + archived) for the HR
 * management page. Unlike `useAnnouncementsBoard`, this hook does NOT filter
 * by `status = 'published'`, giving HR full visibility.
 *
 * RLS `announcements_hr_select_all` must allow hr_admin / super_admin to read
 * all rows regardless of status.
 *
 * Server-side filter: status (sent as query condition when non-empty)
 * Client-side filters: title search + category (in-memory via useMemo)
 */
export function useHRAnnouncements(filters: HRAnnouncementFilters) {
  const [rawAnnouncements, setRawAnnouncements] = useState<HRAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  const { status } = filters;

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    let cancelled = false;

    let query = supabase
      .from("announcements")
      .select(
        "id, author_id, title, body, category, target_roles, pinned, status, published_at, expires_at, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (status) {
      query = query.eq("status", status);
    }

    query.then(({ data, error: fetchError }) => {
      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      const mapped: HRAnnouncement[] = (data ?? []).map((row) => ({
        id: row.id as string,
        authorId: row.author_id as string,
        title: row.title as string,
        body: row.body as string,
        category: (row.category as string) || "General",
        targetRoles: ((row.target_roles ?? []) as UserRoleEnum[]),
        pinned: row.pinned as boolean,
        status: row.status as PublishStatusEnum,
        publishedAt: row.published_at as string | null,
        expiresAt: row.expires_at as string | null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }));

      setRawAnnouncements(mapped);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, version]);

  // Client-side filters applied in memory
  const announcements = useMemo(() => {
    let result = rawAnnouncements;

    if (filters.category) {
      result = result.filter((a) => a.category === filters.category);
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }

    return result;
  }, [rawAnnouncements, filters.category, filters.search]);

  return { announcements, isLoading, error, refetch };
}
