"use client";

import { useState, useEffect, useCallback } from "react";
import type { RequestTypeConfig, RequestTypeCode } from "../types";
import { getRequestTypeMeta, type RequestTypeMeta } from "../catalog";
import { listActiveRequestTypes } from "../actions";

/**
 * `RequestTypeConfig` from DB merged with static `RequestTypeMeta` from catalog.
 * This is the shape consumed by form builders (TASK-012) and request selectors.
 */
export interface EnrichedRequestType extends RequestTypeConfig {
  meta: RequestTypeMeta;
}

/**
 * Fetches active request types from the `request_types` table and merges
 * them with the static frontend catalog (icon, color, form fields).
 *
 * - RLS allows any authenticated user to read active types (see migration 004).
 * - Types with no catalog entry (unknown codes) are silently skipped so that
 *   future DB additions don't break the UI before the catalog is updated.
 *
 * @param codesFilter  Optional allowlist of codes (e.g. MVP_REQUEST_TYPES).
 *                     If omitted, all active DB types with a catalog entry are returned.
 */
export function useRequestTypes(codesFilter?: RequestTypeCode[]) {
  const [types, setTypes] = useState<EnrichedRequestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      let timedOut = false;

      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        if (process.env.NODE_ENV !== "production") {
          console.error("[useRequestTypes] Timeout while loading request types", {
            codesFilter,
          });
        }
        if (!cancelled) {
          setError("La carga de tipos tardó demasiado. Verifica tu conexión e inténtalo de nuevo.");
          setIsLoading(false);
        }
      }, 12000);

      try {
        const { types: data, error: fetchError } = await listActiveRequestTypes(codesFilter);

        if (cancelled || timedOut) return;

        if (fetchError) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[useRequestTypes] Server action fetch error", {
              message: fetchError,
              codesFilter,
            });
          }
          setError(fetchError);
          return;
        }

        const enriched: EnrichedRequestType[] = (data ?? [])
          .map((row) => {
            const meta = getRequestTypeMeta(row.code);
            if (!meta) return null; // unknown code — catalog not updated yet

            return {
              id: row.id,
              code: row.code as RequestTypeCode,
              name: row.name,
              description: row.description,
              requires_approval: row.requires_approval,
              is_active: row.is_active,
              metadata_schema: row.metadata_schema as Record<string, unknown> | null,
              created_at: row.created_at,
              updated_at: row.updated_at,
              meta,
            } satisfies EnrichedRequestType;
          })
          .filter((t): t is EnrichedRequestType => t !== null);

        if (!cancelled) setTypes(enriched);
      } catch (err) {
        if (!cancelled && !timedOut) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[useRequestTypes] Unexpected error", err);
          }
          setError(err instanceof Error ? err.message : "Error al cargar tipos de solicitud");
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled && !timedOut) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  // Re-run only if the filter list reference changes (stable in practice)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(codesFilter), version]);

  return { types, isLoading, error, refetch };
}
