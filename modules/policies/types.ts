import type { PublishStatusEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Policy (maps to `policies` table — TASK-003)
// ---------------------------------------------------------------------------

export interface Policy {
  id: string;
  authorId: string;
  title: string;
  description: string | null;
  category: string;
  version: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  storagePath: string | null;
  status: PublishStatusEnum;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const POLICY_CATEGORIES = [
  "Reglamentos",
  "Manuales",
  "Procedimientos",
  "Beneficios",
  "Seguridad",
] as const;

export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Forms (HR admin — TASK-025)
// ---------------------------------------------------------------------------

/** Fields sent via FormData when creating a new policy (includes file). */
export interface PolicyCreateFormFields {
  title: string;
  description: string;
  category: string;
  version: string;
  publish_immediately: boolean;
  // file: File — passed directly through FormData, not listed here
}

/** Fields used for metadata-only edits (no file replacement). */
export interface PolicyMetadataInput {
  title?: string;
  description?: string | null;
  category?: string;
  version?: string;
}
