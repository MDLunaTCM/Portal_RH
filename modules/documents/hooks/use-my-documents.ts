"use client";

import { useState, useEffect, useCallback } from "react";
import { listMyDocuments } from "@/modules/documents/actions";
import type { EmployeeDocument, DocumentType } from "../types";
import type { DocumentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Status mapping — DB enum → UI DocumentStatus
// ---------------------------------------------------------------------------

function mapDbStatus(raw: string): DocumentStatus {
  switch (raw) {
    case "pending_review":
      return "pending_review";
    case "approved":
    case "active": // legacy rows created before migration
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
 * Fetches the personal documents (expediente) for the current employee.
 * Delegates to the `listMyDocuments` server action to avoid
 * browser-client session timing issues.
 */
export function useMyDocuments(userId: string | null) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { rows, error: fetchError } = await listMyDocuments();

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        if (!cancelled) {
          setDocuments(
            rows.map((row) => ({
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
            })),
          );
          setError(null);
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
  }, [userId, version]);

  return { documents, isLoading, error, refetch };
}
