"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { listPolicies } from "@/modules/policies/actions";
import type { Policy } from "../types";
import type { PublishStatusEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface PolicyFilters {
  /** Client-side: match against title / description */
  search: string;
  /** Client-side: match against category */
  category: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches published policies for the employee-facing policies board (TASK-018).
 * Delegates to the `listPolicies` server action to avoid
 * browser-client session timing issues.
 *
 * Client-side filters: title/description search + category (in-memory).
 */
export function usePolicies(filters: PolicyFilters) {
  const [rawPolicies, setRawPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { rows, error: fetchError } = await listPolicies();

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        if (!cancelled) {
          setRawPolicies(
            rows.map((row): Policy => ({
              id: row.id,
              authorId: row.author_id,
              title: row.title,
              description: row.description,
              category: row.category || "Reglamentos",
              version: row.version || "1.0",
              fileName: row.file_name,
              fileType: row.file_type,
              fileSize: row.file_size,
              storagePath: row.storage_path,
              status: row.status as PublishStatusEnum,
              publishedAt: row.published_at,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            })),
          );
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar reglamentos");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [version]);

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
