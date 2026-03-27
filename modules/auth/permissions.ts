import type { UserRole } from "@/types";
import { HR_ROLES, APPROVER_ROLES } from "@/types";

// -----------------------------------------------------------------------
// Permission actions
// Each string encodes "resource:operation" — granular enough to drive
// both UI guards (RoleGuard, useRole) and Supabase RLS policies.
// -----------------------------------------------------------------------

export type Permission =
  // Requests
  | "requests:create"
  | "requests:read_own"
  | "requests:read_all"
  | "requests:approve"
  | "requests:cancel_own"
  // Payroll receipts
  | "payroll:read_own"
  | "payroll:read_all"
  | "payroll:upload"
  // Employee documents (expediente)
  | "documents:read_own"
  | "documents:read_all"
  | "documents:upload_own"
  | "documents:manage"
  // Announcements
  | "announcements:read"
  | "announcements:manage"
  // Policies / reglamentos
  | "policies:read"
  | "policies:manage"
  // Directory
  | "directory:read"
  // Audit logs
  | "audit_logs:read"
  // HR admin panel
  | "hr_panel:access";

// -----------------------------------------------------------------------
// Permission matrix
// Defines which permissions each role has. Single source of truth —
// both the frontend guards and the Supabase RLS helper function must
// agree with this matrix.
// -----------------------------------------------------------------------

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  employee: [
    "requests:create",
    "requests:read_own",
    "requests:cancel_own",
    "payroll:read_own",
    "documents:read_own",
    "documents:upload_own",
    "announcements:read",
    "policies:read",
    "directory:read",
  ],

  manager: [
    "requests:create",
    "requests:read_own",
    "requests:cancel_own",
    "requests:approve",      // approves direct reports' requests
    "payroll:read_own",
    "documents:read_own",
    "documents:upload_own",
    "announcements:read",
    "policies:read",
    "directory:read",
  ],

  hr_admin: [
    "requests:create",
    "requests:read_own",
    "requests:read_all",
    "requests:cancel_own",
    "requests:approve",
    "payroll:read_own",
    "payroll:read_all",
    "payroll:upload",
    "documents:read_own",
    "documents:read_all",
    "documents:upload_own",
    "documents:manage",
    "announcements:read",
    "announcements:manage",
    "policies:read",
    "policies:manage",
    "directory:read",
    "hr_panel:access",
  ],

  super_admin: [
    "requests:create",
    "requests:read_own",
    "requests:read_all",
    "requests:cancel_own",
    "requests:approve",
    "payroll:read_own",
    "payroll:read_all",
    "payroll:upload",
    "documents:read_own",
    "documents:read_all",
    "documents:upload_own",
    "documents:manage",
    "announcements:read",
    "announcements:manage",
    "policies:read",
    "policies:manage",
    "directory:read",
    "audit_logs:read",
    "hr_panel:access",
  ],
};

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/** Returns true if the given role has the requested permission. */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}

/** Returns true if the given role is in the provided list. */
export function hasRole(role: UserRole, allowed: UserRole | UserRole[]): boolean {
  return Array.isArray(allowed) ? allowed.includes(role) : role === allowed;
}

/** Returns true if the given role can access the HR panel. */
export function isHRRole(role: UserRole): boolean {
  return HR_ROLES.includes(role);
}

/** Returns true if the given role can approve requests. */
export function isApprover(role: UserRole): boolean {
  return APPROVER_ROLES.includes(role);
}
