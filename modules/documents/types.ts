import type { DocumentStatus, UserRole, PublishStatus } from "@/types";

// ---------------------------------------------------------------------------
// Employee documents / expediente (maps to `employee_documents` — TASK-003)
// ---------------------------------------------------------------------------

export type DocumentType =
  | "ine"
  | "curp"
  | "rfc"
  | "nss"
  | "birth_certificate"
  | "address_proof"
  | "degree"
  | "contract"
  | "other";

export interface EmployeeDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  display_name: string;
  file_name: string;
  file_path: string; // Supabase Storage path
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  uploaded_at: string;
  expires_at: string | null;
}

// ---------------------------------------------------------------------------
// Policies / reglamentos (maps to `policies` table — TASK-003)
// ---------------------------------------------------------------------------

export type PolicyCategory =
  | "reglamentos"
  | "politicas"
  | "manuales"
  | "beneficios"
  | "formatos";

export interface Policy {
  id: string;
  title: string;
  description: string | null;
  category: PolicyCategory;
  file_path: string; // Supabase Storage path
  file_name: string;
  version: string | null;
  status: PublishStatus;
  /** Roles that can see this document. Empty = visible to all authenticated users. */
  audience: UserRole[];
  created_by: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ine: "INE / IFE",
  curp: "CURP",
  rfc: "Constancia de RFC",
  nss: "Número de Seguridad Social (IMSS)",
  birth_certificate: "Acta de Nacimiento",
  address_proof: "Comprobante de Domicilio",
  degree: "Título / Certificado de Estudios",
  contract: "Contrato Laboral",
  other: "Otro Documento",
};

export interface DocumentUploadFormValues {
  document_type: DocumentType;
  file: File;
  expires_at?: string;
}

export interface PolicyFormValues {
  title: string;
  description?: string;
  category: PolicyCategory;
  version?: string;
  audience: UserRole[];
  file: File;
  publish_immediately: boolean;
}
