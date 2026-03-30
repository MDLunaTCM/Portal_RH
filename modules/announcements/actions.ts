"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserRoleEnum } from "@/types/database";
import { writeAuditLog } from "@/modules/audit/log";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnnouncementInput {
  title: string;
  body: string;
  category: string;
  target_roles: UserRoleEnum[];
  pinned: boolean;
  expires_at?: string | null;
  featured_image_url?: string;
  featured_image_alt?: string;
  media?: Array<{
    id: string;
    type: "image" | "video";
    url: string;
    alt?: string;
  }>;
}

export interface SaveAnnouncementResult {
  id: string | null;
  error: string | null;
}

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
    throw new Error("Sin permisos para administrar anuncios.");

  return user;
}

// ---------------------------------------------------------------------------
// Read — list published announcements (server-side, for hooks)
// ---------------------------------------------------------------------------

export interface AnnouncementWidgetRow {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  target_roles: string[];
}

export interface ListAnnouncementsResult {
  rows: AnnouncementWidgetRow[];
  error: string | null;
}

/**
 * Fetches published announcements for the dashboard widget.
 * Server-side equivalent of the browser-client query in use-announcements.ts.
 */
export async function listAnnouncements(
  limit = 9,
): Promise<ListAnnouncementsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { rows: [], error: "No autenticado." };
  }

  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, pinned, published_at, created_at, target_roles")
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return { rows: [], error: error.message };

  return {
    rows: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      pinned: row.pinned,
      published_at: row.published_at as string | null,
      created_at: row.created_at,
      target_roles: (row.target_roles ?? []) as string[],
    })),
    error: null,
  };
}

export interface BoardAnnouncementRow {
  id: string;
  title: string;
  body: string;
  category: string;
  target_roles: string[];
  pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  priority: "normal" | "important" | "urgent" | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  media: Array<{
    id: string;
    type: "image" | "video";
    url: string;
    alt?: string;
    thumbnail_url?: string;
  }> | null;
}

export interface ListAnnouncementsBoardResult {
  rows: BoardAnnouncementRow[];
  error: string | null;
}

/**
 * Fetches all published non-expired announcements for the board page.
 * Server-side equivalent of the browser-client query in use-announcements-board.ts.
 */
export async function listAnnouncementsBoard(): Promise<ListAnnouncementsBoardResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { rows: [], error: "No autenticado." };
  }

  const { data, error } = await supabase
    .from("announcements")
    .select(
      "id, title, body, category, target_roles, pinned, published_at, expires_at, created_at, priority, featured_image_url, featured_image_alt, media",
    )
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) return { rows: [], error: error.message };

  return {
    rows: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      category: (row.category as string) || "General",
      target_roles: (row.target_roles ?? []) as string[],
      pinned: row.pinned,
      published_at: (row.published_at ?? row.created_at) as string | null,
      expires_at: row.expires_at as string | null,
      created_at: row.created_at,
      priority: (row.priority as BoardAnnouncementRow["priority"]) ?? "normal",
      featured_image_url: (row.featured_image_url as string | null) ?? null,
      featured_image_alt: (row.featured_image_alt as string | null) ?? null,
      media: (row.media as BoardAnnouncementRow["media"]) ?? null,
    })),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Creates a new announcement.
 *
 * Security:
 *  - `author_id` is always taken from `auth.uid()` server-side.
 *  - Role is verified against `profiles` before insert.
 *  - RLS `announcements_hr_insert` provides a second DB-level check.
 *
 * @param publish_immediately  When true, sets status = "published" and
 *                              published_at = now(). Otherwise status = "draft".
 */
export async function createAnnouncement(
  input: AnnouncementInput & { publish_immediately?: boolean },
): Promise<SaveAnnouncementResult> {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try {
    user = await assertHRUser(supabase);
  } catch (e) {
    return { id: null, error: (e as Error).message };
  }

  if (!input.title.trim()) return { id: null, error: "El título es obligatorio." };
  if (!input.body.trim()) return { id: null, error: "El contenido es obligatorio." };

  const status = input.publish_immediately ? "published" : "draft";
  const published_at = input.publish_immediately ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      author_id: user.id,
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category || "General",
      target_roles: input.target_roles,
      pinned: input.pinned,
      status,
      published_at,
      expires_at: input.expires_at || null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  const announcementId = data.id as string;

  // Update with media if provided from client
  if (input.media && input.media.length > 0) {
    const firstImage = input.media.find((m) => m.type === "image");
    if (firstImage) {
      await supabase
        .from("announcements")
        .update({
          featured_image_url: input.featured_image_url || firstImage.url,
          featured_image_alt: input.featured_image_alt || firstImage.alt,
          media: input.media,
        })
        .eq("id", announcementId);
    }
  }

  await writeAuditLog({
    actor_id: user.id,
    action: "create",
    resource: "announcement",
    resource_id: announcementId,
    metadata: { title: input.title.trim(), status },
  });

  return { id: announcementId, error: null };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Updates an existing announcement's content/metadata.
 * Does not change publication status — use publish/unpublish for that.
 */
export async function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try {
    user = await assertHRUser(supabase);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.body !== undefined) updates.body = input.body.trim();
  if (input.category !== undefined) updates.category = input.category || "General";
  if (input.target_roles !== undefined) updates.target_roles = input.target_roles;
  if (input.pinned !== undefined) updates.pinned = input.pinned;
  if (input.expires_at !== undefined) updates.expires_at = input.expires_at || null;

  // Handle media if provided from client
  if (input.media && input.media.length > 0) {
    const firstImage = input.media.find((m) => m.type === "image");
    if (firstImage) {
      updates.featured_image_url = input.featured_image_url || firstImage.url;
      updates.featured_image_alt = input.featured_image_alt || firstImage.alt;
    }
    updates.media = input.media;
  }

  const { error } = await supabase.from("announcements").update(updates).eq("id", id);
  if (error) return { error: error.message };

  await writeAuditLog({
    actor_id: user.id,
    action: "update",
    resource: "announcement",
    resource_id: id,
    metadata: { fields: Object.keys(updates).join(", ") },
  });

  return { error: null };
}

// ---------------------------------------------------------------------------
// Publish / Unpublish
// ---------------------------------------------------------------------------

/**
 * Publishes a draft announcement (status → "published", published_at = now()).
 */
export async function publishAnnouncement(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try {
    user = await assertHRUser(supabase);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await supabase
    .from("announcements")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await writeAuditLog({
    actor_id: user.id,
    action: "update",
    resource: "announcement",
    resource_id: id,
    metadata: { status: "published" },
  });

  return { error: null };
}

/**
 * Returns a published announcement to draft state (status → "draft").
 */
export async function unpublishAnnouncement(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try {
    user = await assertHRUser(supabase);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await supabase
    .from("announcements")
    .update({ status: "draft" })
    .eq("id", id);

  if (error) return { error: error.message };

  await writeAuditLog({
    actor_id: user.id,
    action: "update",
    resource: "announcement",
    resource_id: id,
    metadata: { status: "draft" },
  });

  return { error: null };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Permanently deletes an announcement.
 * Only drafts or archived announcements should be deleted in practice;
 * the UI should guard against deleting published ones without unpublishing first.
 */
export async function deleteAnnouncement(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof assertHRUser>>;
  try {
    user = await assertHRUser(supabase);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };

  await writeAuditLog({
    actor_id: user.id,
    action: "delete",
    resource: "announcement",
    resource_id: id,
  });

  return { error: null };
}
