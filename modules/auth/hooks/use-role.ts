"use client";

import { useSession } from "@/modules/auth/context";
import {
  hasPermission,
  hasRole,
  isHRRole,
  isApprover,
  type Permission,
} from "@/modules/auth/permissions";
import type { UserRole } from "@/types";

// -----------------------------------------------------------------------
// useRole — read the current user's role and check permissions
//
// Usage:
//   const { role, can, is, isHR } = useRole();
//   if (can("hr_panel:access")) { ... }
//   if (is(["hr_admin", "super_admin"])) { ... }
// -----------------------------------------------------------------------

export interface UseRoleReturn {
  /** The authenticated user's canonical role. Defaults to "employee". */
  role: UserRole;
  /** True if the user has the given permission. */
  can: (permission: Permission) => boolean;
  /** True if the user's role matches any of the provided roles. */
  is: (roles: UserRole | UserRole[]) => boolean;
  /** True if the user can access the HR administration panel. */
  isHR: boolean;
  /** True if the user can approve requests (manager, hr_admin, super_admin). */
  isApprover: boolean;
  /** True while the session is loading (avoid premature permission denials). */
  isLoading: boolean;
}

export function useRole(): UseRoleReturn {
  const { profile, isLoading } = useSession();
  const role: UserRole = profile?.role ?? "employee";

  return {
    role,
    can: (permission: Permission) => hasPermission(role, permission),
    is: (roles: UserRole | UserRole[]) => hasRole(role, roles),
    isHR: isHRRole(role),
    isApprover: isApprover(role),
    isLoading,
  };
}
