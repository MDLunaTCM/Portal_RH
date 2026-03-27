"use client";

import { useState, useEffect, useCallback } from "react";
import { getRequestDetail } from "@/modules/requests/actions";
import type { RequestStatusEnum } from "@/types/database";

export interface RequestDetailAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}

/**
 * Full request detail shape for the detail page (TASK-013).
 */
export interface RequestDetail {
  id: string;
  typeCode: string;
  typeName: string;
  typeDescription: string | null;
  status: RequestStatusEnum;
  metadata: Record<string, unknown>;
  notes: string | null;
  reviewerNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: RequestDetailAttachment[];
}

/**
 * Fetches a single request with its type info and attachments.
 * Delegates to the `getRequestDetail` server action to avoid
 * browser-client session timing issues.
 *
 * @param requestId  UUID of the request row (from URL params). Pass null while loading.
 */
export function useRequestDetail(requestId: string | null) {
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!requestId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { request: row, error: fetchError } = await getRequestDetail(requestId);

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          return;
        }

        if (!row) {
          setError("Solicitud no encontrada.");
          return;
        }

        if (!cancelled) {
          setRequest({
            id: row.id,
            typeCode: row.type_code ?? "",
            typeName: row.type_name ?? "Solicitud",
            typeDescription: row.type_description,
            status: row.status as RequestStatusEnum,
            metadata: row.metadata,
            notes: row.notes,
            reviewerNotes: row.reviewer_notes,
            reviewedAt: row.reviewed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            attachments: row.attachments.map((a) => ({
              id: a.id,
              fileName: a.file_name,
              fileType: a.file_type,
              fileSize: a.file_size,
              storagePath: a.storage_path,
              createdAt: a.created_at,
            })),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar la solicitud");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [requestId, version]);

  return { request, isLoading, error, refetch };
}
