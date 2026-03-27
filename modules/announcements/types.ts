import type { UserRole, PublishStatus } from "@/types";

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
}
