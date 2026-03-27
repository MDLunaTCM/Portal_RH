// ---------------------------------------------------------------------------
// Payroll Receipts (maps to `payroll_receipts` table — TASK-003)
// ---------------------------------------------------------------------------

export type PayrollPeriodType = "regular" | "bonus" | "aguinaldo" | "settlement";

export type ReceiptStatus = "pending" | "processing" | "paid";

export interface PayrollReceipt {
  id: string;
  user_id: string;
  period: string;          // e.g. "Marzo 2026 - 1a quincena"
  pay_date: string;        // ISO date
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: ReceiptStatus;
  type: PayrollPeriodType;
  pdf_path: string | null;  // Supabase Storage path
  xml_path: string | null;  // Supabase Storage path (CFDI)
  created_at: string;
}

// ---------------------------------------------------------------------------
// Receipt detail breakdown
// ---------------------------------------------------------------------------

export interface PayrollConcept {
  concept: string;
  amount: number;
  type: "earning" | "deduction";
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface PayrollFilters {
  year: string;
  month: string;
  search: string;
}
