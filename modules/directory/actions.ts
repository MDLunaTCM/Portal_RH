"use server";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DirectoryProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  hire_date: string | null;
  department_id: string | null;
  department_name: string | null;
  department_code: string | null;
  position_name: string | null;
}

export interface ListDirectoryResult {
  profiles: DirectoryProfileRow[];
  error: string | null;
}

type RawRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  hire_date: string | null;
  department_id: string | null;
  departments: { name: string; code: string } | null;
  positions: { name: string } | null;
};

// ---------------------------------------------------------------------------
// List active employees for the directory
// ---------------------------------------------------------------------------

/**
 * Fetches the active employee directory.
 * Server-side equivalent of the browser-client query in use-directory.ts.
 *
 * Access is controlled by the `profiles_directory_select` RLS policy:
 * any authenticated user may read active profiles.
 */
export async function listDirectory(): Promise<ListDirectoryResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profiles: [], error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, first_name, last_name, email, phone, avatar_url, hire_date, department_id,
       departments(name, code),
       positions(name)`,
    )
    .eq("is_active", true)
    .order("first_name")
    .order("last_name");

  if (error) return { profiles: [], error: error.message };

  return {
    profiles: ((data ?? []) as RawRow[]).map((row) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      avatar_url: row.avatar_url,
      hire_date: row.hire_date,
      department_id: row.department_id,
      department_name: row.departments?.name ?? null,
      department_code: row.departments?.code ?? null,
      position_name: row.positions?.name ?? null,
    })),
    error: null,
  };
}
