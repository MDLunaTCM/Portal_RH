"use client";

import { useState, useEffect, useCallback } from "react";
import { listDirectory } from "@/modules/directory/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DirectoryProfile {
  id: string;
  firstName: string;
  lastName: string;
  /** Derived: `${firstName} ${lastName}` — used for search */
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  hireDate: string | null;
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  positionName: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches the active employee directory.
 * Delegates to the `listDirectory` server action to avoid
 * browser-client session timing issues.
 *
 * Access is controlled by the `profiles_directory_select` RLS policy:
 * any authenticated user may read active profiles.
 */
export function useDirectory() {
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const { profiles: rows, error: fetchError } = await listDirectory();

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        if (!cancelled) {
          setProfiles(
            rows.map((row) => ({
              id: row.id,
              firstName: row.first_name,
              lastName: row.last_name,
              fullName: `${row.first_name} ${row.last_name}`,
              email: row.email,
              phone: row.phone,
              avatarUrl: row.avatar_url,
              hireDate: row.hire_date,
              departmentId: row.department_id,
              departmentName: row.department_name,
              departmentCode: row.department_code,
              positionName: row.position_name,
            })),
          );
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar directorio");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return { profiles, isLoading, error, refetch };
}
