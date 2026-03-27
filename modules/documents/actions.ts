"use server";

import { createClient } from "@/lib/supabase/server";
import {
  employeeDocumentPath,
  STORAGE_BUCKETS,
} from "@/modules/storage/paths";
import { DOCUMENT_TYPE_LABELS } from "./types";
import type { EmployeeDocument, DocumentType } from "./types";
import type { ApiResponse } from "@/types";
import { writeAuditLog } from "@/modules/audit/log";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB — matches bucket policy

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

// ---------------------------------------------------------------------------
// Upload employee document
// ---------------------------------------------------------------------------

/**
 * Server Action — upload a personal document to the employee's expediente.
 *
 * Accepts a `FormData` with:
 *   - `file`          File   — the document to upload
 *   - `document_type` string — one of DocumentType values
 *   - `expires_at`    string — optional ISO date (YYYY-MM-DD)
 *
 * Security:
 *   - Authenticated user is fetched server-side; no user-supplied ID is trusted.
 *   - Storage RLS enforces the `{employee_id}/{category}/{file}` path convention.
 *   - DB RLS `employee_documents_own_insert` restricts `employee_id = auth.uid()`.
 *   - On DB insert failure the uploaded storage object is deleted to avoid orphans.
 */
export async function uploadEmployeeDocument(
  formData: FormData,
): Promise<ApiResponse<EmployeeDocument>> {
  const supabase = await createClient();

  // --- Auth ---
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "No autenticado. Por favor inicia sesión nuevamente." };
  }

  // --- Parse form fields ---
  const file = formData.get("file") as File | null;
  const documentType = (formData.get("document_type") as DocumentType | null);
  const expiresAt = (formData.get("expires_at") as string | null) || null;

  if (!file || file.size === 0) {
    return { data: null, error: "Debes seleccionar un archivo." };
  }
  if (!documentType) {
    return { data: null, error: "Debes seleccionar el tipo de documento." };
  }

  // --- Validate file ---
  if (file.size > MAX_FILE_SIZE) {
    return { data: null, error: "El archivo excede el tamaño máximo de 20 MB." };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      data: null,
      error: "Solo se permiten archivos PDF, JPG, PNG o WebP.",
    };
  }

  // --- Build storage path ---
  // Pattern: {employee_id}/{document_type}/{filename}
  const storagePath = employeeDocumentPath(user.id, documentType, file.name);

  // --- Upload to Supabase Storage ---
  const bytes = await file.arrayBuffer();

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKETS.DOCUMENTS)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: true, // allow re-upload of the same document type
    });

  if (storageError) {
    return {
      data: null,
      error: `Error al subir el archivo: ${storageError.message}`,
    };
  }

  // --- Insert DB record ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: dbError } = await supabase
    .from("employee_documents")
    .insert({
      employee_id: user.id,
      uploaded_by: user.id,
      category: documentType,
      name: DOCUMENT_TYPE_LABELS[documentType] ?? documentType,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      // status defaults to 'pending_review' via DB column default
      expires_at: expiresAt || null,
    })
    .select()
    .single() as { data: any; error: any };

  if (dbError) {
    // Roll back storage upload on DB failure to avoid orphaned files
    await supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .remove([storagePath]);

    return {
      data: null,
      error: `Error al guardar el documento: ${dbError.message}`,
    };
  }

  await writeAuditLog({
    actor_id: user.id,
    action: "upload",
    resource: "employee_document",
    resource_id: row.id,
    metadata: {
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
    },
  });

  return {
    data: {
      id: row.id,
      user_id: row.employee_id,
      document_type: (row.category as DocumentType) ?? "other",
      display_name: row.name,
      file_name: row.file_name,
      file_path: row.storage_path,
      file_size: row.file_size ?? 0,
      mime_type: row.file_type ?? "application/octet-stream",
      status: "pending_review",
      reviewer_id: null,
      reviewer_notes: null,
      reviewed_at: null,
      uploaded_at: row.created_at,
      expires_at: row.expires_at ?? null,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Review an employee document (approve / reject) — HR only
// ---------------------------------------------------------------------------

export type DocumentReviewAction = "approve" | "reject";

export interface ReviewDocumentInput {
  documentId: string;
  action: DocumentReviewAction;
  /** Required when action is "reject". */
  notes?: string;
}

export interface ReviewDocumentResult {
  error: string | null;
}

/**
 * Approves or rejects an employee document on behalf of an HR admin.
 *
 * Security:
 *  - Reviewer identity is taken from `auth.uid()` server-side.
 *  - Reviewer role is verified against the `profiles` table.
 *  - RLS `employee_docs_hr_update` provides a second DB-level check.
 *
 * DB status mapping:
 *  - approve → "approved"
 *  - reject  → "revoked"  (DocumentStatusEnum uses "revoked" for rejected docs)
 *
 * @returns `{ error: null }` on success, `{ error: "message" }` on failure.
 */
export async function reviewEmployeeDocument(
  input: ReviewDocumentInput,
): Promise<ReviewDocumentResult> {
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

  const allowedRoles = ["hr_admin", "super_admin"] as const;
  if (!allowedRoles.includes(reviewerProfile.role as typeof allowedRoles[number])) {
    return { error: "Sin permisos para revisar documentos de expediente." };
  }

  // 3. Validate notes requirement for rejection
  if (input.action === "reject" && !input.notes?.trim()) {
    return { error: "Se requiere un comentario para rechazar el documento." };
  }

  // 4. Map action → DB status
  //    DocumentStatusEnum: "pending_review" | "approved" | "active" | "expired" | "revoked"
  const newStatus = input.action === "approve" ? "approved" : "revoked";

  // 5. Persist the review
  const { error: updateError } = await supabase
    .from("employee_documents")
    .update({
      status: newStatus,
      reviewer_id: user.id,
      reviewer_notes: input.notes?.trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.documentId);

  if (updateError) {
    return { error: updateError.message };
  }

  await writeAuditLog({
    actor_id: user.id,
    action: input.action === "approve" ? "approve" : "reject",
    resource: "employee_document",
    resource_id: input.documentId,
    metadata: {
      review_action: input.action,
      db_status: newStatus,
      ...(input.notes ? { notes: input.notes.trim() } : {}),
    },
  });

  return { error: null };
}

// ---------------------------------------------------------------------------
// Read — list own documents (server-side, for hook)
// ---------------------------------------------------------------------------

export interface EmployeeDocumentRow {
  id: string;
  employee_id: string;
  category: string;
  name: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  status: string;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ListMyDocumentsResult {
  rows: EmployeeDocumentRow[];
  error: string | null;
}

/**
 * Fetches personal documents for the current employee.
 * Server-side equivalent of the browser-client query in use-my-documents.ts.
 */
export async function listMyDocuments(): Promise<ListMyDocumentsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { rows: [], error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  const { data, error } = await supabase
    .from("employee_documents")
    .select(
      "id, employee_id, category, name, file_name, file_type, file_size, storage_path, status, expires_at, created_at",
    )
    .eq("employee_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { rows: [], error: error.message };

  return {
    rows: ((data ?? []) as EmployeeDocumentRow[]).map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      category: row.category,
      name: row.name,
      file_name: row.file_name,
      file_type: row.file_type,
      file_size: row.file_size,
      storage_path: row.storage_path,
      status: row.status,
      reviewer_id: null,
      reviewer_notes: null,
      reviewed_at: null,
      expires_at: row.expires_at,
      created_at: row.created_at,
    })),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Read — list all employee documents for HR (server-side, for hook)
// ---------------------------------------------------------------------------

export interface HREmployeeDocumentRow {
  id: string;
  employee_id: string;
  category: string;
  name: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  status: string;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  created_at: string;
  profile_id: string | null;
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_employee_number: string | null;
  profile_avatar_url: string | null;
}

export interface HRDocumentStatusFilter {
  status: "" | "pending_review" | "approved" | "revoked" | "expired";
}

export interface ListHRDocumentsResult {
  rows: HREmployeeDocumentRow[];
  error: string | null;
}

type RawHRRow = {
  id: string;
  employee_id: string;
  category: string;
  name: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Fetches all employee documents for the HR management page.
 * Server-side equivalent of the browser-client query in use-hr-documents.ts.
 *
 * RLS `employee_docs_hr_select_all` allows hr_admin / super_admin to read all rows.
 * Client-side filters (search, typeCode) are still applied in the hook via useMemo.
 */
export async function listHRDocuments(
  filter: HRDocumentStatusFilter,
): Promise<ListHRDocumentsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { rows: [], error: "No autenticado." };
  }

  let query = supabase
    .from("employee_documents")
    .select(
      "id, employee_id, category, name, file_name, file_type, file_size, storage_path, status, expires_at, created_at, profiles!employee_id(id, first_name, last_name, employee_id, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) return { rows: [], error: error.message };

  return {
    rows: ((data ?? []) as RawHRRow[]).map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      category: row.category,
      name: row.name,
      file_name: row.file_name,
      file_type: row.file_type,
      file_size: row.file_size,
      storage_path: row.storage_path,
      status: row.status,
      reviewer_id: null,
      reviewer_notes: null,
      reviewed_at: null,
      expires_at: row.expires_at,
      created_at: row.created_at,
      profile_id: row.profiles?.id ?? null,
      profile_first_name: row.profiles?.first_name ?? null,
      profile_last_name: row.profiles?.last_name ?? null,
      profile_employee_number: row.profiles?.employee_id ?? null,
      profile_avatar_url: row.profiles?.avatar_url ?? null,
    })),
    error: null,
  };
}
