"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { writeAuditLog } from "@/modules/audit/log";
import type { RequestTypeCode } from "./types";

export interface CreateRequestInput {
  /** UUID of the selected request_type row */
  requestTypeId: string;
  /**
   * Type-specific form values — keys match RequestTypeField.key from catalog.
   * File fields are excluded (uploaded client-side after insert).
   */
  metadata: Record<string, unknown>;
}

export interface CreateRequestResult {
  requestId: string | null;
  error: string | null;
}

export interface ListRequestTypesResult {
  types: {
    id: string;
    code: RequestTypeCode;
    name: string;
    description: string | null;
    requires_approval: boolean;
    is_active: boolean;
    metadata_schema: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  }[];
  error: string | null;
}

export interface ListMyRequestsResult {
  requests: {
    id: string;
    status: string;
    metadata: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
    request_type_name: string | null;
    request_type_code: string | null;
  }[];
  error: string | null;
}

/**
 * Reads active request types server-side and returns them to client hooks.
 * This avoids browser-side hangs when local Supabase endpoints are unreachable.
 */
export async function listActiveRequestTypes(
  codesFilter?: RequestTypeCode[],
): Promise<ListRequestTypesResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { types: [], error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  let query = supabase
    .from("request_types")
    .select("id, code, name, description, requires_approval, is_active, metadata_schema, created_at, updated_at")
    .eq("is_active", true)
    .order("name");

  if (codesFilter && codesFilter.length > 0) {
    query = query.in("code", codesFilter);
  }

  const { data, error } = await query;

  if (error) {
    return { types: [], error: error.message };
  }

  return {
    types: (data ?? []).map((row) => ({
      id: row.id,
      code: row.code as RequestTypeCode,
      name: row.name,
      description: row.description,
      requires_approval: row.requires_approval,
      is_active: row.is_active,
      metadata_schema: row.metadata_schema as Record<string, unknown> | null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    error: null,
  };
}

/**
 * Lists requests for the authenticated employee.
 * Uses server-side auth context and keeps the same shape expected by list UI.
 */
export async function listMyRequests(): Promise<ListMyRequestsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { requests: [], error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  const { data, error } = await supabase
    .from("requests")
    .select("id, status, metadata, notes, created_at, request_types(name, code)")
    .eq("employee_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { requests: [], error: error.message };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    metadata: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
    request_types:
      | { name: string; code: string }
      | Array<{ name: string; code: string }>
      | null;
  }>;

  const requests = rows.map((row) => {
    const relation = row.request_types;

    const requestType = Array.isArray(relation) ? relation[0] ?? null : relation;

    return {
      id: row.id,
      status: row.status,
      metadata: row.metadata as Record<string, unknown> | null,
      notes: row.notes,
      created_at: row.created_at,
      request_type_name: requestType?.name ?? null,
      request_type_code: requestType?.code ?? null,
    };
  });

  return { requests, error: null };
}

/**
 * Inserts a new request row on behalf of the authenticated employee.
 *
 * Security:
 *   - `employee_id` is always set to `auth.uid()` server-side — never trusted from the client.
 *   - RLS `requests_own_insert` policy enforces `employee_id = auth.uid()` on the DB side.
 *   - `notes` is extracted from `metadata.notes` if present (mirrors the notes column for
 *     dashboard description extraction in `use-my-requests.ts` and `use-my-requests-list.ts`).
 *
 * @returns `requestId` on success, `error` message on failure.
 */
export async function createRequest(
  input: CreateRequestInput,
): Promise<CreateRequestResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { requestId: null, error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  // Surface metadata.notes into the dedicated column so the dashboard
  // description extraction works without needing to query metadata.
  const notes =
    typeof input.metadata.notes === "string" && input.metadata.notes.trim()
      ? input.metadata.notes.trim()
      : null;

  const { data, error } = await supabase
    .from("requests")
    .insert({
      request_type_id: input.requestTypeId,
      employee_id: user.id,
      metadata: input.metadata as Json,
      notes,
      status: "pending" as const,
    })
    .select("id")
    .single();

  if (error) {
    return { requestId: null, error: error.message };
  }

  await writeAuditLog({
    actor_id: user.id,
    action: "create",
    resource: "request",
    resource_id: data.id,
    metadata: { request_type_id: input.requestTypeId },
  });

  return { requestId: data.id, error: null };
}

// ---------------------------------------------------------------------------
// Widget: recent requests for the dashboard (employee view)
// ---------------------------------------------------------------------------

export interface ListMyRequestsWidgetResult {
  rows: {
    id: string;
    status: string;
    metadata: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
    request_type_name: string | null;
  }[];
  error: string | null;
}

type WidgetRow = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  request_types: { name: string } | null;
};

/**
 * Fetches the current employee's most recent requests for the dashboard widget.
 * Server-side equivalent of the browser-client query in use-my-requests.ts.
 */
export async function listMyRequestsWidget(
  limit = 5,
): Promise<ListMyRequestsWidgetResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { rows: [], error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  const { data, error } = await supabase
    .from("requests")
    .select("id, status, metadata, notes, created_at, request_types(name)")
    .eq("employee_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { rows: [], error: error.message };

  return {
    rows: ((data ?? []) as WidgetRow[]).map((row) => ({
      id: row.id,
      status: row.status,
      metadata: row.metadata,
      notes: row.notes,
      created_at: row.created_at,
      request_type_name: row.request_types?.name ?? null,
    })),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Request detail (single row + attachments)
// ---------------------------------------------------------------------------

export interface RequestDetailRow {
  id: string;
  status: string;
  metadata: Record<string, unknown>;
  notes: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  type_code: string | null;
  type_name: string | null;
  type_description: string | null;
  attachments: {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    created_at: string;
  }[];
}

export interface GetRequestDetailResult {
  request: RequestDetailRow | null;
  error: string | null;
}

type RawAttachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
};

type DetailRow = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  request_types: { code: string; name: string; description: string | null } | null;
  request_attachments: RawAttachment[] | null;
};

/**
 * Fetches a single request with its type info and attachments.
 * Server-side equivalent of the browser-client query in use-request-detail.ts.
 */
export async function getRequestDetail(
  requestId: string,
): Promise<GetRequestDetailResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { request: null, error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  const { data, error: fetchError } = await supabase
    .from("requests")
    .select(
      `id, status, metadata, notes, reviewer_notes, reviewed_at, created_at, updated_at,
       request_types(code, name, description),
       request_attachments(id, file_name, file_type, file_size, storage_path, created_at)`,
    )
    .eq("id", requestId)
    .single();

  if (fetchError) {
    return {
      request: null,
      error:
        fetchError.code === "PGRST116"
          ? "Solicitud no encontrada o sin acceso."
          : fetchError.message,
    };
  }

  if (!data) return { request: null, error: "Solicitud no encontrada." };

  const row = data as unknown as DetailRow;
  const rt = row.request_types;
  const rawAttachments = row.request_attachments ?? [];

  return {
    request: {
      id: row.id,
      status: row.status,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      notes: row.notes,
      reviewer_notes: row.reviewer_notes,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      type_code: rt?.code ?? null,
      type_name: rt?.name ?? null,
      type_description: rt?.description ?? null,
      attachments: rawAttachments,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Review a request (approve / reject / request_changes)
// ---------------------------------------------------------------------------

/** Actions a reviewer can take on a pending request. */
export type ReviewAction = "approve" | "reject" | "request_changes";

export interface ReviewRequestInput {
  requestId: string;
  action: ReviewAction;
  /** Required when action is "reject" or "request_changes". */
  notes?: string;
}

export interface ReviewRequestResult {
  error: string | null;
}

/**
 * Updates a request's status on behalf of an HR admin, super admin, or manager.
 *
 * Security:
 *  - Reviewer identity is always taken from `auth.uid()` server-side.
 *  - Reviewer role is verified against the `profiles` table.
 *  - RLS policies `requests_hr_update` and `requests_manager_team_update`
 *    provide a second layer of enforcement at the DB level.
 *
 * Status mapping:
 *  - approve           → status = "approved"
 *  - reject            → status = "rejected"   (notes required)
 *  - request_changes   → status = "pending"    (comment added, keeps in queue)
 *
 * @returns `{ error: null }` on success, `{ error: "message" }` on failure.
 */
export async function reviewRequest(
  input: ReviewRequestInput,
): Promise<ReviewRequestResult> {
  const supabase = await createClient();

  // 1. Identify reviewer
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  // 2. Verify reviewer role (server-side guard in addition to RLS)
  const { data: reviewerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !reviewerProfile) {
    return { error: "No se pudo verificar el perfil del revisor." };
  }

  const allowedRoles = ["hr_admin", "super_admin", "manager"] as const;
  if (!allowedRoles.includes(reviewerProfile.role as typeof allowedRoles[number])) {
    return { error: "Sin permisos para revisar solicitudes." };
  }

  // 3. Validate notes requirement
  if (
    (input.action === "reject" || input.action === "request_changes") &&
    !input.notes?.trim()
  ) {
    return { error: "Se requiere un comentario para rechazar o solicitar cambios." };
  }

  // 4. Map action → DB status
  const newStatus =
    input.action === "approve"
      ? ("approved" as const)
      : input.action === "reject"
        ? ("rejected" as const)
        : ("pending" as const); // request_changes: keep pending, add comment

  // 5. Persist the review
  const { error: updateError } = await supabase
    .from("requests")
    .update({
      status: newStatus,
      reviewer_id: user.id,
      reviewer_notes: input.notes?.trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.requestId);

  if (updateError) {
    return { error: updateError.message };
  }

  const auditAction =
    input.action === "approve"
      ? "approve" as const
      : input.action === "reject"
      ? "reject" as const
      : "update" as const;

  await writeAuditLog({
    actor_id: user.id,
    action: auditAction,
    resource: "request",
    resource_id: input.requestId,
    metadata: {
      review_action: input.action,
      ...(input.notes ? { notes: input.notes.trim() } : {}),
    },
  });

  return { error: null };
}
