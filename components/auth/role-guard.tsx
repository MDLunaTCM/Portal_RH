"use client";

import type { ReactNode } from "react";
import { useRole } from "@/modules/auth/hooks/use-role";
import type { UserRole } from "@/types";
import type { Permission } from "@/modules/auth/permissions";

// -----------------------------------------------------------------------
// RoleGuard — conditionally render children based on role or permission.
//
// Usage:
//   // By permission (preferred — role-agnostic):
//   <RoleGuard permission="hr_panel:access">
//     <HRDashboard />
//   </RoleGuard>
//
//   // By explicit role list:
//   <RoleGuard roles={["hr_admin", "super_admin"]}>
//     <AdminButton />
//   </RoleGuard>
//
//   // With custom fallback:
//   <RoleGuard permission="audit_logs:read" fallback={<AccessDenied />}>
//     <AuditLog />
//   </RoleGuard>
// -----------------------------------------------------------------------

interface RoleGuardProps {
  /** Render if the user has this permission. Checked via the permission matrix. */
  permission?: Permission;
  /** Render if the user's role is in this list. */
  roles?: UserRole | UserRole[];
  /** Rendered when the guard blocks access. Defaults to null (silent). */
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({
  permission,
  roles,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { can, is, isLoading } = useRole();

  // While session is loading, render nothing to avoid flash of wrong content
  if (isLoading) return null;

  const allowed =
    (permission !== undefined && can(permission)) ||
    (roles !== undefined && is(roles));

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
