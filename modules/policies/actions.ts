"use server";

import { createClient } from "@/lib/supabase/server";
import {
  policyDocumentPath,
  STORAGE_BUCKETS,
} from "@/modules/storage/paths";
import type { PolicyMetadataInput } from "./types";
import { writeAuditLog } from "@/modules/audit/log";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

// ---------------------------------------------------------------------------
// Internal helper — verify HR role
// ---------------------------------------------------------------------------

const HR_ALLOWED = ["hr_admin", "super_admin"] as const;

async function assertHRUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("No autenticado.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) throw new Error("No se pudo verificar el perfil.");

  if (!HR_ALLOWED.includes(profile.role as (typeof HR_ALLOWED)[number]))
    throw new Error("Sin permisos para administrar reglamentos.");

  return user;
}

// ---------------------------------------------------------------------------
// Create policy (with file upload)
// ---------------------------------------------------------------------------

/**
 * Creates a new policy/document and uploads its file to the `policies` bucket.
 *
 * Accepts a `FormData` with:
 *   - `title`               string  (required)
 *   - `description`         string  (optional)
 *   - `category`            string  (required)
 *   - `version`             string  (defaults to "1.0")
 *   - `file`                File    (required)
 *   - `publish_immediately` "true" | "false"
 *
 * Security:
 *   - `author_id` is always set from `auth.uid()` server-side.
 *   - Role verified against `profiles` before any operation.
 *   - On DB insert failure the uploaded file is removed to avoid orphans.
 *   - RLS `policies_hr_insert` provides a second DB-level check.
 */
export async function createPolicy(
  formData: FormData,
): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try {
    user = await assertHRUser(supabase);
  } catch (e) {
    return { id: null, error: (e as Error).message };
  }

  // --- Parse fields ---
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const category = (formData.get("category") as string | null) ?? "Reglamentos";
  const version = (formData.get("version") as string | null)?.trim() || "1.0";
  const publishImmediately = formData.get("publish_immediately") === "true";
  const file = formData.get("file") as File | null;

  if (!title) return { id: null, error: "El título es obligatorio." };
  if (!file || file.size === 0) return { id: null, error: "Debes adjuntar un archivo." };

  // --- Validate file ---
  if (file.size > MAX_FILE_SIZE)
    return { id: null, error: "El archivo excede el tamaño máximo de 50 MB." };
  if (!ALLOWED_MIME_TYPES.includes(file.type))
    return { id: null, error: "Solo se permiten archivos PDF o DOCX." };

  // --- Upload to storage ---
  const storagePath = policyDocumentPath(category.toLowerCase(), file.name);
  const bytes = await file.arrayBuffer();

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKETS.POLICIES)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (storageError)
    return { id: null, error: `Error al subir el archivo: ${storageError.message}` };

  // --- Insert DB record ---
  const status = publishImmediately ? "published" : "draft";
  const published_at = publishImmediately ? new Date().toISOString() : null;

  const { data, error: dbError } = await supabase
    .from("policies")
    .insert({
      author_id: user.id,
      title,
      description,
      category,
      version,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      status,
      published_at,
    })
    .select("id")
    .single();

  if (dbError) {
    // Roll back storage upload to avoid orphaned files
    await supabase.storage.from(STORAGE_BUCKETS.POLICIES).remove([storagePath]);
    return { id: null, error: `Error al guardar el registro: ${dbError.message}` };
  }

  await writeAuditLog({
    actor_id: user.id,
    action: "upload",
    resource: "policy",
    resource_id: data.id as string,
    metadata: { title, category, version, status, file_name: file.name, file_size: file.size },
  });

  return { id: data.id as string, error: null };
}

// ---------------------------------------------------------------------------
// Update policy metadata (no file replacement)
// ---------------------------------------------------------------------------

/**
 * Updates title, description, category, and/or version of an existing policy.
 * File is not replaced — use deletePolicy + createPolicy for that.
 */
export async function updatePolicyMetadata(
  id: string,
  input: PolicyMetadataInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try {
    user = await assertHRUser(supabase);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title?.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.category !== undefined) updates.category = input.category;
  if (input.version !== undefined) updates.version = input.version?.trim() || "1.0";

  const { error } = await supabase.from("policies").update(updates).eq("id", id);
  if (error) return { error: error.message };

  await writeAuditLog({
    actor_id: user.id,
    action: "update",
    resource: "policy",
    resource_id: id,
    metadata: { fields: Object.keys(updates).join(", ") },
  });

  return { error: null };
}

// ---------------------------------------------------------------------------
// Publish / Unpublish
// ---------------------------------------------------------------------------

export async function publishPolicy(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try { user = await assertHRUser(supabase); } catch (e) { return { error: (e as Error).message }; }

  const { error } = await supabase
    .from("policies")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await writeAuditLog({
    actor_id: user.id,
    action: "update",
    resource: "policy",
    resource_id: id,
    metadata: { status: "published" },
  });

  return { error: null };
}

export async function unpublishPolicy(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try { user = await assertHRUser(supabase); } catch (e) { return { error: (e as Error).message }; }

  const { error } = await supabase
    .from("policies")
    .update({ status: "draft" })
    .eq("id", id);

  if (error) return { error: error.message };

  await writeAuditLog({
    actor_id: user.id,
    action: "update",
    resource: "policy",
    resource_id: id,
    metadata: { status: "draft" },
  });

  return { error: null };
}

// ---------------------------------------------------------------------------
// Delete policy (DB row + optional storage cleanup)
// ---------------------------------------------------------------------------

/**
 * Permanently deletes a policy record and its associated storage file (if any).
 * The storage DELETE operation is best-effort: DB row is removed regardless.
 */
export async function deletePolicy(
  id: string,
  storagePath: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try { user = await assertHRUser(supabase); } catch (e) { return { error: (e as Error).message }; }

  // Delete DB row first
  const { error } = await supabase.from("policies").delete().eq("id", id);
  if (error) return { error: error.message };

  // Best-effort storage cleanup
  if (storagePath) {
    await supabase.storage.from(STORAGE_BUCKETS.POLICIES).remove([storagePath]);
  }

  await writeAuditLog({
    actor_id: user.id,
    action: "delete",
    resource: "policy",
    resource_id: id,
  });

  return { error: null };
}

// ---------------------------------------------------------------------------
// Read — list published policies (server-side, for hook)
// ---------------------------------------------------------------------------

export interface PolicyRow {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  category: string;
  version: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  storage_path: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListPoliciesResult {
  rows: PolicyRow[];
  error: string | null;
}

/**
 * Fetches published policies for the employee-facing board.
 * Server-side equivalent of the browser-client query in use-policies.ts.
 *
 * RLS `policies_published_read` enforces status = 'published' at the DB level.
 */
export async function listPolicies(): Promise<ListPoliciesResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { rows: [], error: "No autenticado. Inicia sesión e intenta de nuevo." };
  }

  const { data, error } = await supabase
    .from("policies")
    .select(
      "id, author_id, title, description, category, version, file_name, file_type, file_size, storage_path, status, published_at, created_at, updated_at",
    )
    .eq("status", "published")
    .order("category", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) return { rows: [], error: error.message };

  return {
    rows: ((data ?? []) as PolicyRow[]).map((row) => ({
      id: row.id,
      author_id: row.author_id,
      title: row.title,
      description: row.description,
      category: row.category,
      version: row.version,
      file_name: row.file_name,
      file_type: row.file_type,
      file_size: row.file_size,
      storage_path: row.storage_path,
      status: row.status,
      published_at: row.published_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    error: null,
  };
}
