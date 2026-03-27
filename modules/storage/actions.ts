"use server";

import { createClient } from "@/lib/supabase/server";
import type { StorageBucket } from "./paths";

/**
 * Generate a short-lived signed URL for a private file download.
 *
 * Must be called server-side — never expose raw storage paths or bucket
 * names to the client. The authenticated user's session is used, so the
 * underlying RLS SELECT policy is enforced: employees can only generate
 * signed URLs for files they own, HR can generate for any file.
 *
 * @param bucket     One of the four StorageBucket constants
 * @param path       Full path within the bucket (use helpers from paths.ts)
 * @param expiresIn  URL lifetime in seconds (default: 3600 = 1 hour)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) return { signedUrl: null, error: error.message };
  return { signedUrl: data.signedUrl, error: null };
}

/**
 * Delete a file from storage.
 *
 * RLS DELETE policies enforce who can delete:
 *   - payroll-receipts:    super_admin only
 *   - employee-documents:  super_admin only
 *   - policies:            super_admin only
 *   - request-attachments: uploader or HR/super_admin
 *
 * Supabase storage returns no error when deleting a non-existent file,
 * so callers do not need to check existence first.
 */
export async function deleteStorageFile(
  bucket: StorageBucket,
  path: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: error.message };
  return { error: null };
}
