import type { RequestStatus } from "@/types";

// ---------------------------------------------------------------------------
// Catalog — mirrors the `request_types` DB table exactly
// ---------------------------------------------------------------------------

/**
 * All valid request type codes present in the `request_types` table.
 * Must stay in sync with the seed migrations (TASK-003 + TASK-010).
 *
 * MVP set (Sprint 1):
 *   vacation            — Vacaciones
 *   employment_letter   — Constancia de empleo
 *   card_replacement    — Reposición de tarjeta de nómina
 *   badge_replacement   — Reposición de gafete
 *   parking_card        — Tarjeta de estacionamiento
 *   document_update     — Actualización documental
 *
 * Additional types seeded in TASK-003 (available but not in UI yet):
 *   permission          — Permiso
 *   advance_payment     — Anticipo de nómina
 *   document_request    — Solicitud de documento
 */
export type RequestTypeCode =
  | "vacation"
  | "employment_letter"
  | "card_replacement"
  | "badge_replacement"
  | "parking_card"
  | "document_update"
  | "permission"
  | "advance_payment"
  | "document_request";

/**
 * Runtime shape of a `request_types` row as returned by Supabase.
 * Fields match the DB columns 1:1 — no derived fields here.
 */
export interface RequestTypeConfig {
  id: string;
  code: RequestTypeCode;
  name: string;
  description: string | null;
  /** Single boolean — the DB does not distinguish manager vs HR approval at row level */
  requires_approval: boolean;
  is_active: boolean;
  /** JSON Schema object used for metadata validation (from DB) */
  metadata_schema: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface Request {
  id: string;
  request_type_id: string;
  request_type?: RequestTypeConfig;
  employee_id: string;
  reviewer_id: string | null;
  status: RequestStatus;
  /** Domain-specific fields stored as JSON, schema defined per type */
  metadata: Record<string, unknown>;
  notes: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestAttachment {
  id: string;
  request_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Metadata shapes per request type (for type-safe form handling in TASK-012)
// ---------------------------------------------------------------------------

export interface VacationMetadata {
  vacation_type: "vacation" | "personal" | "medical" | "other";
  start_date: string;
  end_date: string;
  days_requested: number;
  notes?: string;
}

export interface EmploymentLetterMetadata {
  purpose: "general" | "visa" | "credit" | "rental" | "other";
  include_salary: boolean;
  notes?: string;
}

export interface CardReplacementMetadata {
  reason: "lost" | "stolen" | "damaged";
  last_digits?: string;
  notes?: string;
}

export interface BadgeReplacementMetadata {
  reason: "lost" | "stolen" | "damaged" | "expired";
  notes?: string;
}

export interface ParkingCardMetadata {
  reason: "new" | "replacement" | "lost" | "damaged";
  vehicle_plate?: string;
  notes?: string;
}

export interface DocumentUpdateMetadata {
  document_type: "nss" | "rfc" | "address" | "emergency_contact" | "bank_info" | "other";
  notes?: string;
}

export interface PermissionMetadata {
  permission_type: "medical" | "personal" | "bereavement" | "other";
  date: string;
  hours: number;
  notes?: string;
}

export interface AdvancePaymentMetadata {
  amount: number;
  reason?: string;
}

export interface DocumentRequestMetadata {
  document_type: "contract" | "payroll_receipt" | "social_security" | "tax_id" | "other";
  notes?: string;
}

// ---------------------------------------------------------------------------
// Forms (used by TASK-012)
// ---------------------------------------------------------------------------

export interface NewRequestFormValues {
  request_type_code: RequestTypeCode;
  metadata: Record<string, unknown>;
  notes?: string;
}
