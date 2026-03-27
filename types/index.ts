/**
 * Shared application-wide TypeScript types.
 * This is the canonical source of truth — import from here, not from inline definitions.
 *
 * NOTE on UserRole: V0 pages currently define UserRole inline as
 * "employee" | "hr" | "manager" | "admin".
 * The canonical values below match CLAUDE.md. V0 pages will be migrated
 * to use this definition when Supabase Auth is wired up (TASK-004 / TASK-005).
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type UserRole = "employee" | "manager" | "hr_admin" | "super_admin";

/** Roles that can access the HR administration panel */
export const HR_ROLES: UserRole[] = ["hr_admin", "super_admin"];

/** Roles that can approve subordinate requests */
export const APPROVER_ROLES: UserRole[] = ["manager", "hr_admin", "super_admin"];

// ---------------------------------------------------------------------------
// Generic API wrappers
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Common status enums
// ---------------------------------------------------------------------------

export type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "in_review";

export type DocumentStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired";

export type PublishStatus = "draft" | "published" | "archived";
