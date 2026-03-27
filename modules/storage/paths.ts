/**
 * Storage path conventions for Portal RH.
 *
 * All four buckets are private. Files are accessed via signed URLs
 * generated server-side (see actions.ts). The application layer must
 * enforce these path conventions — the storage RLS policies rely on
 * the first path segment being a valid UUID for owner/request checks.
 *
 * Conventions:
 *   payroll-receipts    → {employee_id}/{period}/{filename}
 *   employee-documents  → {employee_id}/{category}/{filename}
 *   policies            → {category}/{filename}
 *   request-attachments → {request_id}/{filename}
 */

export const STORAGE_BUCKETS = {
  PAYROLL: "payroll-receipts",
  DOCUMENTS: "employee-documents",
  POLICIES: "policies",
  ATTACHMENTS: "request-attachments",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Sanitize a user-provided filename for safe storage.
 * Strips accents, replaces non-alphanumeric characters with underscores,
 * and lowercases the result. Preserves the file extension.
 */
export function sanitizeFilename(filename: string): string {
  const ext = filename.includes(".")
    ? "." + filename.split(".").pop()!.toLowerCase()
    : "";
  const base = filename
    .replace(/\.[^.]+$/, "")          // strip extension before normalizing
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip combining diacritics
    .replace(/[^a-zA-Z0-9_-]/g, "_") // replace unsafe chars
    .replace(/_+/g, "_")              // collapse consecutive underscores
    .replace(/^_|_$/g, "")           // trim leading/trailing underscores
    .toLowerCase();
  return (base || "file") + ext;
}

/**
 * Path for a payroll receipt PDF.
 *
 * Bucket: payroll-receipts
 * Pattern: {employee_id}/{period}/{filename}
 *
 * @param employeeId  Profile UUID of the employee (= auth.uid())
 * @param period      Payroll period in YYYY-MM format, e.g. "2025-01"
 * @param filename    Original filename (will be sanitized)
 *
 * @example
 * payrollReceiptPath("3f4a...uuid", "2025-01", "Recibo Enero 2025.pdf")
 * // → "3f4a...uuid/2025-01/recibo_enero_2025.pdf"
 */
export function payrollReceiptPath(
  employeeId: string,
  period: string,
  filename: string
): string {
  return `${employeeId}/${period}/${sanitizeFilename(filename)}`;
}

/**
 * Path for an employee personal document.
 *
 * Bucket: employee-documents
 * Pattern: {employee_id}/{category}/{filename}
 *
 * Suggested categories: "contracts", "identifications", "certificates",
 * "bank-info", "education", "other"
 *
 * @example
 * employeeDocumentPath("3f4a...uuid", "contracts", "Contrato Laboral.pdf")
 * // → "3f4a...uuid/contracts/contrato_laboral.pdf"
 */
export function employeeDocumentPath(
  employeeId: string,
  category: string,
  filename: string
): string {
  return `${employeeId}/${category}/${sanitizeFilename(filename)}`;
}

/**
 * Path for a company policy document.
 *
 * Bucket: policies
 * Pattern: {category}/{filename}
 *
 * Suggested categories: "reglamentos", "manuales", "procedimientos",
 * "beneficios", "seguridad"
 *
 * @example
 * policyDocumentPath("reglamentos", "Reglamento Interno 2025.pdf")
 * // → "reglamentos/reglamento_interno_2025.pdf"
 */
export function policyDocumentPath(category: string, filename: string): string {
  return `${category}/${sanitizeFilename(filename)}`;
}

/**
 * Path for a request attachment.
 *
 * Bucket: request-attachments
 * Pattern: {request_id}/{filename}
 *
 * The first segment MUST be the request UUID — storage RLS validates it
 * against can_access_request() to enforce request-level visibility.
 *
 * @example
 * requestAttachmentPath("a1b2...uuid", "Evidencia Médica.jpg")
 * // → "a1b2...uuid/evidencia_medica.jpg"
 */
export function requestAttachmentPath(
  requestId: string,
  filename: string
): string {
  return `${requestId}/${sanitizeFilename(filename)}`;
}
