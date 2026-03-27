"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { Modal, Select, FileUpload, DatePicker } from "@/components/ui/shared";
import {
  IconDocument,
  IconDownload,
  IconUpload,
  IconAlertCircle,
  IconCheckCircle,
  IconClock,
  IconCalendar,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import { useMyDocuments } from "@/modules/documents/hooks/use-my-documents";
import { uploadEmployeeDocument } from "@/modules/documents/actions";
import { getSignedUrl } from "@/modules/storage/actions";
import { STORAGE_BUCKETS } from "@/modules/storage/paths";
import { DOCUMENT_TYPE_LABELS } from "@/modules/documents/types";
import type { EmployeeDocument, DocumentType } from "@/modules/documents/types";
import type { DocumentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; variant: "success" | "warning" | "error" | "default"; icon: React.ReactNode }
> = {
  approved: {
    label: "Aprobado",
    variant: "success",
    icon: <IconCheckCircle className="w-3.5 h-3.5" />,
  },
  pending_review: {
    label: "En revisión",
    variant: "warning",
    icon: <IconClock className="w-3.5 h-3.5" />,
  },
  expired: {
    label: "Vencido",
    variant: "default",
    icon: <IconCalendar className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Rechazado",
    variant: "error",
    icon: <IconAlertCircle className="w-3.5 h-3.5" />,
  },
};

function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = (
  Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]
).map(([value, label]) => ({ value, label }));

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getMimeIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMG";
  return "DOC";
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} padding="sm">
            <CardContent>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg border border-border"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ onRetry, detail }: { onRetry: () => void; detail?: string | null }) {
  return (
    <Card className="border-error-border bg-error/10">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mb-4">
            <IconAlertCircle className="w-8 h-8 text-error-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error al cargar documentos
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            No pudimos cargar tu expediente. Verifica tu conexión e intenta de
            nuevo.
          </p>
          {detail && (
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted px-3 py-2 rounded max-w-sm break-all">
              {detail}
            </p>
          )}
          <Button onClick={onRetry}>Intentar de nuevo</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Document detail panel (shown inside Modal)
// ---------------------------------------------------------------------------

function DocumentDetail({ doc }: { doc: EmployeeDocument }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleView = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    const { signedUrl, error } = await getSignedUrl(
      STORAGE_BUCKETS.DOCUMENTS,
      doc.file_path,
      300, // 5-minute URL
    );

    setIsDownloading(false);

    if (error || !signedUrl) {
      setDownloadError("No se pudo generar el enlace. Inténtalo de nuevo.");
      return;
    }

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const statusCfg = STATUS_CONFIG[doc.status];

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div
        className={`p-4 rounded-lg flex items-center gap-3 ${
          doc.status === "approved"
            ? "bg-success/10 border border-success-border"
            : doc.status === "rejected"
            ? "bg-error/10 border border-error-border"
            : doc.status === "expired"
            ? "bg-muted border border-border"
            : "bg-warning/10 border border-warning-border"
        }`}
      >
        <div className="shrink-0">{statusCfg.icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{statusCfg.label}</p>
          {doc.reviewed_at && (
            <p className="text-xs text-muted-foreground">
              Revisado el {formatDate(doc.reviewed_at)}
            </p>
          )}
        </div>
      </div>

      {/* Reviewer notes (if rejected or approved with comment) */}
      {doc.reviewer_notes && (
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Comentario de RH
          </p>
          <p className="text-sm text-foreground">{doc.reviewer_notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <span className="text-sm font-medium text-foreground">
            {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Archivo</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {doc.file_name}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Tamaño</span>
          <span className="text-sm font-medium text-foreground">
            {formatBytes(doc.file_size)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Subido el</span>
          <span className="text-sm font-medium text-foreground">
            {formatDate(doc.uploaded_at)}
          </span>
        </div>
        {doc.expires_at && (
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Vigencia</span>
            <span className="text-sm font-medium text-foreground">
              {formatDate(doc.expires_at)}
            </span>
          </div>
        )}
      </div>

      {/* Download error */}
      {downloadError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error border border-error-border text-error-foreground text-sm">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      <Button
        className="w-full"
        leftIcon={<IconDownload className="w-4 h-4" />}
        onClick={handleView}
        isLoading={isDownloading}
        disabled={isDownloading}
      >
        Ver / Descargar archivo
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload form (shown inside Modal)
// ---------------------------------------------------------------------------

interface UploadFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

function UploadForm({ onSuccess, onClose }: UploadFormProps) {
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const needsExpiry: DocumentType[] = [
    "ine",
    "address_proof",
    "degree",
    "contract",
  ];
  const showExpiry = documentType && needsExpiry.includes(documentType as DocumentType);

  const handleSubmit = () => {
    setFormError(null);

    if (!documentType) {
      setFormError("Selecciona el tipo de documento.");
      return;
    }
    if (!selectedFile) {
      setFormError("Selecciona un archivo.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_type", documentType);
    if (expiresAt) formData.append("expires_at", expiresAt);

    startTransition(async () => {
      const result = await uploadEmployeeDocument(formData);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      onSuccess();
    });
  };

  return (
    <div className="space-y-5">
      <Select
        label="Tipo de documento"
        options={[
          { value: "", label: "Selecciona un tipo..." },
          ...DOCUMENT_TYPE_OPTIONS,
        ]}
        value={documentType}
        onChange={(v) => setDocumentType(v as DocumentType | "")}
        error={!documentType && formError ? "Requerido" : undefined}
      />

      <FileUpload
        label="Archivo"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        maxSize={20 * 1024 * 1024}
        helperText="PDF, JPG, PNG o WebP · Máx. 20 MB"
        onFilesSelected={(files) => setSelectedFile(files[0] ?? null)}
      />

      {showExpiry && (
        <DatePicker
          label="Fecha de vigencia (opcional)"
          value={expiresAt}
          onChange={setExpiresAt}
          min={new Date().toISOString().split("T")[0]}
        />
      )}

      {formError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error border border-error-border text-error-foreground text-sm">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={isPending}
          disabled={isPending}
          leftIcon={!isPending ? <IconUpload className="w-4 h-4" /> : undefined}
        >
          Subir documento
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PersonalDocumentsPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const userId = user?.id ?? null;

  const { documents, isLoading, error, refetch } = useMyDocuments(userId);

  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const total = documents.length;
  const pendingCount = documents.filter((d) => d.status === "pending_review").length;
  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const rejectedCount = documents.filter(
    (d) => d.status === "rejected" || d.status === "expired",
  ).length;

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setUploadSuccess(true);
    refetch();
    setTimeout(() => setUploadSuccess(false), 4000);
  };

  const showLoading = sessionLoading || isLoading;

  if (showLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refetch} detail={error} />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi expediente</h1>
          <p className="text-muted-foreground">
            Documentos personales y laborales registrados en RH
          </p>
        </div>
        <Button
          leftIcon={<IconUpload className="w-4 h-4" />}
          onClick={() => setShowUpload(true)}
        >
          Subir documento
        </Button>
      </div>

      {/* Upload success notice */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success-border text-success-foreground">
          <IconCheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Documento enviado</p>
            <p className="text-xs">
              Tu documento fue subido correctamente y está en revisión por RH.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconDocument className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card padding="sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <IconClock className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En revisión</p>
                <p className="text-xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card padding="sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <IconCheckCircle className="w-5 h-5 text-success-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aprobados</p>
                <p className="text-xl font-bold text-foreground">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card padding="sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error">
                <IconAlertCircle className="w-5 h-5 text-error-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Con observación</p>
                <p className="text-xl font-bold text-foreground">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document list */}
      <Card padding="none">
        <CardHeader className="p-6 pb-4">
          <CardTitle>Documentos registrados</CardTitle>
          <CardDescription>
            Haz clic en un documento para ver su detalle o descargarlo
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {documents.length === 0 ? (
            <EmptyState
              icon={<IconDocument className="w-12 h-12" />}
              title="Sin documentos registrados"
              description="Aún no tienes documentos en tu expediente. Sube el primero con el botón de arriba."
              action={
                <Button
                  leftIcon={<IconUpload className="w-4 h-4" />}
                  onClick={() => setShowUpload(true)}
                >
                  Subir primer documento
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 transition-colors gap-3 text-left"
                >
                  {/* Left — icon + info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {getMimeIcon(doc.mime_type)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_name} · {formatBytes(doc.file_size)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Subido: {formatDate(doc.uploaded_at)}
                        {doc.expires_at
                          ? ` · Vigencia: ${formatDate(doc.expires_at)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right — status + download */}
                  <div className="flex items-center gap-3 sm:shrink-0">
                    <StatusBadge status={doc.status} />
                    <span className="text-muted-foreground">
                      <IconDownload className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected documents notice */}
      {rejectedCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-error/10 border border-error-border">
          <IconAlertCircle className="w-5 h-5 text-error-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {rejectedCount === 1
                ? "Tienes 1 documento con observación"
                : `Tienes ${rejectedCount} documentos con observación`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Haz clic en el documento para ver el comentario de RH y volver a
              subirlo si es necesario.
            </p>
          </div>
        </div>
      )}

      {/* Document detail modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={
          selectedDoc
            ? (DOCUMENT_TYPE_LABELS[selectedDoc.document_type] ?? "Documento")
            : "Detalle"
        }
        description={selectedDoc?.file_name}
        size="md"
      >
        {selectedDoc && <DocumentDetail doc={selectedDoc} />}
      </Modal>

      {/* Upload modal */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title="Subir documento"
        description="El documento quedará en revisión hasta que RH lo apruebe."
        size="md"
      >
        <UploadForm
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUpload(false)}
        />
      </Modal>
    </div>
  );
}
