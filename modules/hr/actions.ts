"use server";

import { createClient } from "@/lib/supabase/server";
import type { HRDashboardMetrics } from "@/modules/hr/types";

// ---------------------------------------------------------------------------
// HR Dashboard
// ---------------------------------------------------------------------------

export interface HRTeamAlertRow {
  id: string;
  category: string | null;
  created_at: string;
  profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

export interface GetHRDashboardDataResult {
  metrics: HRDashboardMetrics;
  newHires30d: number;
  teamAlerts: HRTeamAlertRow[];
  error: string | null;
}

type AlertRow = {
  id: string;
  category: string | null;
  created_at: string;
  profiles: { first_name: string; last_name: string; avatar_url: string | null } | null;
};

type PendingRow = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  request_types: { name: string } | null;
  profiles: { first_name: string; last_name: string } | null;
};

type HRRow = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  request_types: { name: string; code: string } | null;
  profiles: { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
};

const EMPTY_METRICS: HRDashboardMetrics = {
  total_employees: 0,
  active_employees: 0,
  pending_requests: 0,
  pending_documents: 0,
  active_announcements: 0,
  open_positions: 0,
};

/**
 * Fetches HR dashboard aggregate metrics and recent team alerts.
 * Server-side equivalent of the browser-client queries in use-hr-dashboard.ts.
 *
 * RLS ensures only hr_admin / super_admin can read cross-employee data.
 */
export async function getHRDashboardData(): Promise<GetHRDashboardDataResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { metrics: EMPTY_METRICS, newHires30d: 0, teamAlerts: [], error: "No autenticado." };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split("T")[0];

  const [empResult, reqResult, docResult, annResult, hiresResult, alertsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("employee_documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("hire_date", thirtyDaysAgoIso)
        .eq("is_active", true),
      supabase
        .from("employee_documents")
        .select(
          "id, category, created_at, profiles!employee_id(first_name, last_name, avatar_url)",
        )
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const firstError = [empResult, reqResult, docResult, annResult, hiresResult].find(
    (r) => r.error,
  );
  if (firstError?.error) {
    return {
      metrics: EMPTY_METRICS,
      newHires30d: 0,
      teamAlerts: [],
      error: firstError.error.message,
    };
  }

  const teamAlerts: HRTeamAlertRow[] = ((alertsResult.data ?? []) as AlertRow[]).map(
    (row) => ({
      id: row.id,
      category: row.category,
      created_at: row.created_at,
      profile: row.profiles,
    }),
  );

  return {
    metrics: {
      total_employees: empResult.count ?? 0,
      active_employees: empResult.count ?? 0,
      pending_requests: reqResult.count ?? 0,
      pending_documents: docResult.count ?? 0,
      active_announcements: annResult.count ?? 0,
      open_positions: 0,
    },
    newHires30d: hiresResult.count ?? 0,
    teamAlerts,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// HR Pending Requests widget
// ---------------------------------------------------------------------------

export interface HRPendingRequestRow {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  request_type_name: string | null;
  employee_first_name: string | null;
  employee_last_name: string | null;
}

export interface ListHRPendingRequestsResult {
  requests: HRPendingRequestRow[];
  error: string | null;
}

/**
 * Fetches pending requests across all employees for the HR inbox widget.
 * Server-side equivalent of the browser-client query in use-hr-pending-requests.ts.
 */
export async function listHRPendingRequests(
  limit = 8,
): Promise<ListHRPendingRequestsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { requests: [], error: "No autenticado." };
  }

  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, status, metadata, notes, created_at, request_types(name), profiles!employee_id(first_name, last_name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return { requests: [], error: error.message };

  return {
    requests: ((data ?? []) as PendingRow[]).map((row) => ({
      id: row.id,
      status: row.status,
      metadata: row.metadata,
      notes: row.notes,
      created_at: row.created_at,
      request_type_name: row.request_types?.name ?? null,
      employee_first_name: row.profiles?.first_name ?? null,
      employee_last_name: row.profiles?.last_name ?? null,
    })),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// HR full requests list (with filters)
// ---------------------------------------------------------------------------

export interface HRRequestFiltersInput {
  status: "" | "pending" | "approved" | "rejected";
  date_from: string;
  date_to: string;
}

export interface HRRequestRow {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  request_type_name: string | null;
  request_type_code: string | null;
  employee_id: string | null;
  employee_first_name: string | null;
  employee_last_name: string | null;
  employee_avatar_url: string | null;
}

export interface ListHRRequestsResult {
  requests: HRRequestRow[];
  error: string | null;
}

/**
 * Fetches all requests for the HR inbox with server-side status and date filters.
 * Server-side equivalent of the browser-client query in use-hr-requests-list.ts.
 *
 * Client-side filters (typeCode, search) are still applied in the hook via useMemo.
 */
export async function listHRRequests(
  filters: HRRequestFiltersInput,
): Promise<ListHRRequestsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { requests: [], error: "No autenticado." };
  }

  let query = supabase
    .from("requests")
    .select(
      "id, status, metadata, notes, created_at, reviewed_at, request_types(name, code), profiles!employee_id(id, first_name, last_name, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.status === "pending") {
    query = query.in("status", ["pending", "draft"]);
  } else if (filters.status === "approved") {
    query = query.eq("status", "approved");
  } else if (filters.status === "rejected") {
    query = query.eq("status", "rejected");
  }

  if (filters.date_from) {
    query = query.gte("created_at", `${filters.date_from}T00:00:00`);
  }
  if (filters.date_to) {
    query = query.lte("created_at", `${filters.date_to}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) return { requests: [], error: error.message };

  return {
    requests: ((data ?? []) as HRRow[]).map((row) => ({
      id: row.id,
      status: row.status,
      metadata: row.metadata,
      notes: row.notes,
      created_at: row.created_at,
      reviewed_at: row.reviewed_at,
      request_type_name: row.request_types?.name ?? null,
      request_type_code: row.request_types?.code ?? null,
      employee_id: row.profiles?.id ?? null,
      employee_first_name: row.profiles?.first_name ?? null,
      employee_last_name: row.profiles?.last_name ?? null,
      employee_avatar_url: row.profiles?.avatar_url ?? null,
    })),
    error: null,
  };
}
