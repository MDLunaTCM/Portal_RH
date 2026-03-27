// ---------------------------------------------------------------------------
// Organization structure (maps to `departments` and `positions` — TASK-003)
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  name: string;
  code: string;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Position {
  id: string;
  title: string;
  department_id: string;
  department?: Department;
  level: string | null;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Directory view (public, limited fields — no salary/sensitive info)
// ---------------------------------------------------------------------------

export interface EmployeeDirectory {
  id: string;
  full_name: string;
  email: string;
  position_title: string | null;
  department_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

// ---------------------------------------------------------------------------
// Directory filters
// ---------------------------------------------------------------------------

export interface DirectoryFilters {
  search: string;
  department_id: string;
  position_id: string;
}
