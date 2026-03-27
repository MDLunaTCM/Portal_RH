"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Tabs,
  EmptyState,
  Skeleton,
  Avatar,
} from "@/components/ui";
import { Modal } from "@/components/ui/shared";
import {
  IconDocument,
  IconDownload,
  IconSearch,
  IconAlertCircle,
  IconCheckCircle,
  IconClock,
  IconCalendar,
  IconCheck,
  IconClose,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useHRDocuments,
  type HREmployeeDocument,
  type HRDocumentFilters,
} from "@/modules/documents/hooks/use-hr-documents";
import { reviewEmployeeDocument } from "@/modules/documents/actions";
import { getSignedUrl } from "@/modules/storage/actions";
import { STORAGE_BUCKETS } from "@/modules/storage/paths";
import type { DocumentStatus } from "@/types";
import type { DocumentType } from "@/modules/documents/types";
import { DOCUMENT_TYPE_LABELS } from "@/modules/documents/types";

// ---------------------------------------------------------------------------
// Status config (identical to personal/page.tsx — shared pattern)
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
    <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TabStatus = "all" | "pending_review" | "approved" | "rejected";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  ...(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

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
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 rounded-lg border border-border"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-error-border bg-error/10">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mb-4">
            <IconAlertCircle className="w-8 h-8 text-error-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error al cargar expedientes
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            No pudimos cargar los documentos. Verifica tu conexión e intenta de nuevo.
          </p>
          <Button onClick={onRetry}>Intentar de nuevo</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Review modal content
// ---------------------------------------------------------------------------

interface ReviewModalProps {
  doc: HREmployeeDocument;
  onSuccess: () => void;
  onClose: () => void;
}

function ReviewModalContent({ doc, onSuccess, onClose }: ReviewModalProps) {
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    const { signedUrl, error } = await getSignedUrl(
      STORAGE_BUCKETS.DOCUMENTS,
      doc.file_path,
      300,
    );
    setIsDownloading(false);
    if (error || !signedUrl) {
      setDownloadError("No se pudo generar el enlace. Inténtalo de nuevo.");
      return;
    }
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleReview = (action: "approve" | "reject") => {
    setFormError(null);
    if (action === "reject" && !notes.trim()) {
      setFormError("El comentario es obligatorio para rechazar un documento.");
      return;
    }
    startTransition(async () => {
      const result = await reviewEmployeeDocument({
        documentId: doc.id,
        action,
        notes: notes.trim() || undefined,
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      onSuccess();
    });
  };

  const statusCfg = STATUS_CONFIG[doc.status];
  const alreadyReviewed = doc.status !== "pending_review";

  return (
    <div className="space-y-5">
      {/* Current status banner */}
      <div
        className={`p-4 rounded-lg flex items-center gap-3 ${
          doc.status === "approved"
            ? "bg-success/10 border border-success-border"
            : doc.status === "rejected"
              ? "bg-error/10 border border-error/30"
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

      {/* Previous reviewer notes */}
      {doc.reviewer_notes && (
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Comentario de revisión anterior
          </p>
          <p className="text-sm text-foreground">{doc.reviewer_notes}</p>
        </div>
      )}

      {/* Document metadata */}
      <div className="space-y-2 text-sm">
        {[
          { label: "Tipo", value: DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type },
          { label: "Archivo", value: doc.file_name },
          { label: "Tamaño", value: formatBytes(doc.file_size) },
          { label: "Subido", value: formatDate(doc.uploaded_at) },
          ...(doc.expires_at
            ? [{ label: "Vigencia", value: formatDate(doc.expires_at) }]
            : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground truncate max-w-[220px]">{value}</span>
          </div>
        ))}
      </div>

      {/* Download error */}
      {downloadError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error-foreground text-sm">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Download button */}
      <Button
        variant="outline"
        className="w-full"
        leftIcon={<IconDownload className="w-4 h-4" />}
        onClick={handleDownload}
        isLoading={isDownloading}
        disabled={isDownloading || isPending}
      >
        Ver / Descargar archivo
      </Button>

      {/* Review form — only when document is still pending */}
      {!alreadyReviewed && (
        <>
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Decisión de revisión</p>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Comentario (obligatorio para rechazar, opcional para aprobar)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Escribe tu comentario aquí..."
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error-foreground text-sm">
                <IconAlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="secondary"
                onClick={() => handleReview("reject")}
                isLoading={isPending}
                disabled={isPending}
                leftIcon={!isPending ? <IconClose className="w-4 h-4" /> : undefined}
              >
                Rechazar
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleReview("approve")}
                isLoading={isPending}
                disabled={isPending}
                leftIcon={!isPending ? <IconCheck className="w-4 h-4" /> : undefined}
              >
                Aprobar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Already reviewed — only cancel option */}
      {alreadyReviewed && (
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Cerrar
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocumentManagementPage() {
  const { profile, isLoading: sessionLoading } = useSession();
  const router = useRouter();

  // Tab drives server-side status filter
  const [activeTab, setActiveTab] = useState<TabStatus>("all");
  const [search, setSearch] = useState("");
  const [typeCode, setTypeCode] = useState("");

  // Selected document for review modal
  const [selectedDoc, setSelectedDoc] = useState<HREmployeeDocument | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Build server-side status filter for the hook
  type HRStatusFilter = HRDocumentFilters["status"];
  const statusFilter: HRStatusFilter =
    activeTab === "all"
      ? ""
      : activeTab === "rejected"
        ? "revoked"
        : activeTab; // "pending_review" | "approved"

  const filters: HRDocumentFilters = {
    status: statusFilter,
    search,
    typeCode,
  };

  const { documents, isLoading, error, refetch } = useHRDocuments(filters);

  // Counts over the unfiltered set — fetch all once for accurate tab counts
  const allDocs = useHRDocuments({ status: "", search, typeCode });

  const counts = {
    all: allDocs.documents.length,
    pending_review: allDocs.documents.filter((d) => d.status === "pending_review").length,
    approved: allDocs.documents.filter((d) => d.status === "approved").length,
    rejected: allDocs.documents.filter((d) => d.status === "rejected").length,
  };

  const tabs = [
    { id: "all", label: "Todos", count: counts.all },
    { id: "pending_review", label: "En revisión", count: counts.pending_review },
    { id: "approved", label: "Aprobados", count: counts.approved },
    { id: "rejected", label: "Rechazados", count: counts.rejected },
  ];

  // Role guard — redirect non-HR users
  const role = profile?.role;
  if (!sessionLoading && profile && role !== "hr_admin" && role !== "super_admin") {
    router.replace("/dashboard");
    return null;
  }

  const handleReviewSuccess = () => {
    setSelectedDoc(null);
    setReviewSuccess(true);
    refetch();
    allDocs.refetch();
    setTimeout(() => setReviewSuccess(false), 4000);
  };

  const showLoading = sessionLoading || isLoading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Gestión de Expedientes
        </h1>
        <p className="text-muted-foreground">
          Revisa y aprueba los documentos enviados por los colaboradores
        </p>
      </div>

      {/* Review success notice */}
      {reviewSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success-border text-success-foreground">
          <IconCheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Documento revisado</p>
            <p className="text-xs">El estatus del documento fue actualizado correctamente.</p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: counts.all,
            icon: <IconDocument className="w-5 h-5 text-primary" />,
            bg: "bg-primary/10",
          },
          {
            label: "En revisión",
            value: counts.pending_review,
            icon: <IconClock className="w-5 h-5 text-warning-foreground" />,
            bg: "bg-warning/20",
          },
          {
            label: "Aprobados",
            value: counts.approved,
            icon: <IconCheckCircle className="w-5 h-5 text-success-foreground" />,
            bg: "bg-success/10",
          },
          {
            label: "Rechazados",
            value: counts.rejected,
            icon: <IconAlertCircle className="w-5 h-5 text-error-foreground" />,
            bg: "bg-error/10",
          },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Employee search */}
            <div className="relative flex-1 min-w-48">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por colaborador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Document type */}
            <select
              value={typeCode}
              onChange={(e) => setTypeCode(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Clear */}
            {(search || typeCode) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setTypeCode("");
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabStatus)}
      />

      {/* Document list */}
      <Card padding="none">
        <CardHeader className="p-6 pb-4">
          <CardTitle>Documentos registrados</CardTitle>
          <CardDescription>
            Haz clic en &ldquo;Revisar&rdquo; para aprobar o rechazar un documento
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {showLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<IconDocument className="w-12 h-12" />}
              title="Sin documentos"
              description={
                activeTab === "all"
                  ? "No hay documentos registrados con los filtros actuales."
                  : `No hay documentos ${
                      activeTab === "pending_review"
                        ? "en revisión"
                        : activeTab === "approved"
                          ? "aprobados"
                          : "rechazados"
                    } con los filtros actuales.`
              }
            />
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const initials = doc.employee.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors gap-3"
                  >
                    {/* Left — employee + document info */}
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Employee avatar */}
                      <Avatar
                        src={doc.employee.avatar_url ?? undefined}
                        alt={doc.employee.name}
                        fallback={initials}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {doc.employee.name}
                        </p>
                        {doc.employee.employee_number && (
                          <p className="text-xs text-muted-foreground">
                            #{doc.employee.employee_number}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-primary">
                              {getMimeIcon(doc.mime_type)}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground truncate">
                            {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.file_name} · {formatBytes(doc.file_size)} · Subido{" "}
                          {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>

                    {/* Right — status + action */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <StatusBadge status={doc.status} />
                      <Button
                        variant={doc.status === "pending_review" ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        {doc.status === "pending_review" ? "Revisar" : "Ver detalle"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={
          selectedDoc
            ? (DOCUMENT_TYPE_LABELS[selectedDoc.document_type] ?? "Documento")
            : "Detalle"
        }
        description={selectedDoc ? `${selectedDoc.employee.name} · ${selectedDoc.file_name}` : undefined}
        size="md"
      >
        {selectedDoc && (
          <ReviewModalContent
            doc={selectedDoc}
            onSuccess={handleReviewSuccess}
            onClose={() => setSelectedDoc(null)}
          />
        )}
      </Modal>
    </div>
  );
}
