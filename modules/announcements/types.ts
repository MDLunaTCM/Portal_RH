import type { UserRole, PublishStatus } from "@/types";

// ---------------------------------------------------------------------------
// Media Types (MVP-light: images + video embeds)
// ---------------------------------------------------------------------------

export interface AnnouncementMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt?: string;
  thumbnail_url?: string; // For videos, to show preview
}

// ---------------------------------------------------------------------------
// Announcements (maps to `announcements` table — TASK-003)
// ---------------------------------------------------------------------------

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  excerpt: string | null;
  priority: AnnouncementPriority;
  /** Roles that can see this announcement. Empty array = visible to all. */
  audience: UserRole[];
  status: PublishStatus;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // NEW: Media & visual enhancements
  featured_image_url?: string;
  featured_image_alt?: string;
  media?: AnnouncementMedia[];
}

// ---------------------------------------------------------------------------
// Forms (HR admin — TASK-024)
// ---------------------------------------------------------------------------

export interface AnnouncementFormValues {
  title: string;
  body: string;
  priority: AnnouncementPriority;
  audience: UserRole[];
  expires_at?: string;
  publish_immediately: boolean;
  // NEW: Media fields
  featured_image_url?: string;
  featured_image_alt?: string;
  media?: AnnouncementMedia[];
}
