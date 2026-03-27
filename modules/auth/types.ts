import type { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// UserProfile — mirrors the `profiles` table (TASK-003 schema)
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;              // PK = auth.users.id
  employee_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  department_id: string | null;
  position_id: string | null;
  manager_id: string | null;
  hire_date: string | null; // ISO date
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Returns the profile's full display name. */
export function getFullName(profile: UserProfile): string {
  return `${profile.first_name} ${profile.last_name}`.trim();
}

/** Human-readable labels for each role. */
export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Colaborador",
  manager: "Manager",
  hr_admin: "RH",
  super_admin: "Administrador",
};

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SetPasswordFormValues {
  employeeId: string;
  password: string;
  confirmPassword: string;
}
