// ---------------------------------------------------------------------------
// HR operations and audit (Sprint 2 — TASK-020 to TASK-026)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

export interface HRDashboardMetrics {
  total_employees: number;
  active_employees: number;
  pending_requests: number;
  pending_documents: number;
  active_announcements: number;
  open_positions: number;
}

// ---------------------------------------------------------------------------
// Request review
// ---------------------------------------------------------------------------

export type ReviewAction = "approve" | "reject" | "request_changes";

export interface RequestReviewFormValues {
  action: ReviewAction;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Audit log (maps to `audit_logs` table — TASK-003)
// Sensitive actions are recorded: approvals, rejections, document access, etc.
// ---------------------------------------------------------------------------

export type AuditAction =
  | "request.approved"
  | "request.rejected"
  | "document.approved"
  | "document.rejected"
  | "document.viewed"
  | "announcement.published"
  | "policy.published"
  | "profile.updated";

export interface AuditLog {
  id: string;
  actor_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  /** Minimal snapshot for context — never store sensitive PII */
  payload: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// HR inbox filters
// ---------------------------------------------------------------------------

export interface HRInboxFilters {
  status: string;
  request_type: string;
  department_id: string;
  date_from: string;
  date_to: string;
  search: string;
}
