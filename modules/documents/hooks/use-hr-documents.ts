"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { listHRDocuments } from "@/modules/documents/actions";
import type { EmployeeDocument, DocumentType } from "../types";
import type { DocumentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** EmployeeDocument enriched with the owner's profile info, for the HR view. */
export interface HREmployeeDocument extends EmployeeDocument {
  employee: {
    id: string;
    name: string;
    employee_number: string | null;
    avatar_url: string | null;
  };
}

export interface HRDocumentFilters {
  /** Server-side: DB status. Empty = all. */
  status: "" | "pending_review" | "approved" | "revoked" | "expired";
  /** Client-side: match against employee name */
  search: string;
  /** Client-side: match against document category code */
  typeCode: string;
}

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

function mapDbStatus(raw: string): DocumentStatus {
  switch (raw) {
    case "pending_review":
      return "pending_review";
    case "approved":
    case "active":
      return "approved";
    case "expired":
      return "expired";
    case "revoked":
    case "rejected":
      return "rejected";
    default:
      return "pending_review";
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches employee_documents for ALL employees — used by the HR management
 * page (TASK-023).
 * Delegates to the `listHRDocuments` server action to avoid
 * browser-client session timing issues.
 *
 * Server-side filter: status
 * Client-side filters: employee name search + document type (in-memory)
 */
export function useHRDocuments(filters: HRDocumentFilters) {
  const [rawDocuments, setRawDocuments] = useState<HREmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  const { status } = filters;

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { rows, error: fetchError } = await listHRDocuments({ status });

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        const mapped: HREmployeeDocument[] = rows.map((row) => ({
          id: row.id,
          user_id: row.employee_id,
          document_type: (row.category as DocumentType) ?? "other",
          display_name: row.name,
          file_name: row.file_name,
          file_path: row.storage_path,
          file_size: row.file_size ?? 0,
          mime_type: row.file_type ?? "application/octet-stream",
          status: mapDbStatus(row.status ?? "pending_review"),
          reviewer_id: row.reviewer_id,
          reviewer_notes: row.reviewer_notes,
          reviewed_at: row.reviewed_at,
          uploaded_at: row.created_at,
          expires_at: row.expires_at,
          employee: {
            id: row.profile_id ?? row.employee_id,
            name:
              row.profile_first_name && row.profile_last_name
                ? `${row.profile_first_name} ${row.profile_last_name}`
                : "Colaborador",
            employee_number: row.profile_employee_number,
            avatar_url: row.profile_avatar_url,
          },
        }));

        if (!cancelled) {
          setRawDocuments(mapped);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar documentos");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, version]);

  // Client-side filters applied in memory
  const documents = useMemo(() => {
    let result = rawDocuments;

    if (filters.typeCode) {
      result = result.filter((d) => d.document_type === filters.typeCode);
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((d) => d.employee.name.toLowerCase().includes(q));
    }

    return result;
  }, [rawDocuments, filters.typeCode, filters.search]);

  return { documents, isLoading, error, refetch };
}
