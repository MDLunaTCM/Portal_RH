"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublishStatusEnum } from "@/types/database";
import type { Policy } from "../types";

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface HRPolicyFilters {
  /** Server-side: DB status. Empty = all. */
  status: "" | "draft" | "published" | "archived";
  /** Client-side: match against title */
  search: string;
  /** Client-side: match against category */
  category: string;
}

// ---------------------------------------------------------------------------
// DB → Policy mapper
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Policy {
  return {
    id:          row.id as string,
    authorId:    row.author_id as string,
    title:       row.title as string,
    description: row.description as string | null,
    category:    (row.category as string) || "Reglamentos",
    version:     (row.version as string) || "1.0",
    fileName:    row.file_name as string | null,
    fileType:    row.file_type as string | null,
    fileSize:    row.file_size as number | null,
    storagePath: row.storage_path as string | null,
    status:      row.status as PublishStatusEnum,
    publishedAt: row.published_at as string | null,
    createdAt:   row.created_at as string,
    updatedAt:   row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches ALL policy rows (draft + published + archived) for the HR
 * management page (TASK-025).
 *
 * Unlike an employee-facing hook, there is no status filter applied by
 * default — HR needs full visibility. RLS `policies_hr_select_all` must
 * allow hr_admin / super_admin to read every row.
 *
 * Server-side filter: status (when non-empty)
 * Client-side filters: title search + category (in-memory via useMemo)
 */
export function useHRPolicies(filters: HRPolicyFilters) {
  const [rawPolicies, setRawPolicies] = useState<Policy[]>([]);
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
      .from("policies")
      .select(
        "id, author_id, title, description, category, version, file_name, file_type, file_size, storage_path, status, published_at, created_at, updated_at",
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

      setRawPolicies((data ?? []).map(mapRow));
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, version]);

  // Client-side filters applied in memory
  const policies = useMemo(() => {
    let result = rawPolicies;

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [rawPolicies, filters.category, filters.search]);

  return { policies, isLoading, error, refetch };
}
