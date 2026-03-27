"use server";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PayrollReceiptRow {
  id: string;
  period: string;
  period_type: string | null;
  gross_amount: number;
  net_amount: number;
  concepts: unknown;
  storage_path: string;
  issued_at: string;
  created_at: string;
}

export interface ListMyPayrollResult {
  receipts: PayrollReceiptRow[];
  error: string | null;
}

// ---------------------------------------------------------------------------
// List payroll receipts for the current employee
// ---------------------------------------------------------------------------

/**
 * Fetches payroll receipts for the authenticated employee.
 * Server-side equivalent of the browser-client query in use-my-payroll.ts.
 *
 * RLS `payroll_own_select` enforces `employee_id = auth.uid()` at the DB level.
 */
export async function listMyPayroll(): Promise<ListMyPayrollResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { receipts: [], error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  const { data, error } = await supabase
    .from("payroll_receipts")
    .select(
      "id, period, period_type, gross_amount, net_amount, concepts, storage_path, issued_at, created_at",
    )
    .eq("employee_id", user.id)
    .order("issued_at", { ascending: false });

  if (error) return { receipts: [], error: error.message };

  return {
    receipts: ((data ?? []) as PayrollReceiptRow[]).map((row) => ({
      id: row.id,
      period: row.period,
      period_type: row.period_type,
      gross_amount: row.gross_amount,
      net_amount: row.net_amount,
      concepts: row.concepts,
      storage_path: row.storage_path,
      issued_at: row.issued_at,
      created_at: row.created_at,
    })),
    error: null,
  };
}
