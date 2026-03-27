"use client";

import { useState, useEffect, useCallback } from "react";
import { listMyPayroll } from "@/modules/payroll/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PayrollConcept {
  concept: string;
  amount: number;
  /** "earning" = percepción, "deduction" = deducción */
  type: "earning" | "deduction";
}

/**
 * Normalized shape of a payroll_receipts row for the UI.
 */
export interface PayrollReceipt {
  id: string;
  /** Raw period string from DB — "YYYY-MM" format */
  period: string;
  /** e.g. "quincenal", "mensual", "aguinaldo", "finiquito", "bono" */
  periodType: string;
  grossAmount: number;
  netAmount: number;
  /** Parsed from the concepts JSONB column */
  concepts: PayrollConcept[];
  /** Storage path for the PDF in the payroll-receipts bucket */
  storagePath: string;
  issuedAt: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// JSON parser
// ---------------------------------------------------------------------------

function parseConcepts(raw: unknown): PayrollConcept[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).concept === "string" &&
        typeof (item as Record<string, unknown>).amount === "number",
    )
    .map((item) => ({
      concept: item.concept as string,
      amount: item.amount as number,
      type: item.type === "deduction" ? ("deduction" as const) : ("earning" as const),
    }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches payroll receipts for the current employee.
 * Delegates to the `listMyPayroll` server action to avoid
 * browser-client session timing issues.
 */
export function useMyPayroll(userId: string | null) {
  const [receipts, setReceipts] = useState<PayrollReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { receipts: rows, error: fetchError } = await listMyPayroll();

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        if (!cancelled) {
          setReceipts(
            rows.map((row) => ({
              id: row.id,
              period: row.period,
              periodType: row.period_type ?? "quincenal",
              grossAmount: row.gross_amount,
              netAmount: row.net_amount,
              concepts: parseConcepts(row.concepts),
              storagePath: row.storage_path,
              issuedAt: row.issued_at,
              createdAt: row.created_at,
            })),
          );
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar recibos");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  return { receipts, isLoading, error, refetch };
}
