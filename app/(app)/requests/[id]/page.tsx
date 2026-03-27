"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from "@/components/ui";
import { Timeline } from "@/components/ui/shared";
import {
  IconCheck,
  IconClock,
  IconClose,
  IconAlertCircle,
  IconDownload,
  IconInbox,
} from "@/components/icons";
import {
  useRequestDetail,
  type RequestDetailAttachment,
} from "@/modules/requests/hooks/use-request-detail";
import { getRequestTypeMeta } from "@/modules/requests/catalog";
import { getSignedUrl } from "@/modules/storage/actions";
import { STORAGE_BUCKETS } from "@/modules/storage/paths";
import { reviewRequest, type ReviewAction } from "@/modules/requests/actions";
import { useSession } from "@/modules/auth/context";
import type { RequestStatusEnum } from "@/types/database";
import type { RequestTypeField } from "@/modules/requests/catalog";

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusConfig: Record<
  RequestStatusEnum,
  { variant: "warning" | "success" | "error" | "info"; icon: typeof IconClock; label: string }
> = {
  draft:     { variant: "info",    icon: IconClock, label: "Borrador" },
  pending:   { variant: "warning", icon: IconClock, label: "Pendiente" },
  approved:  { variant: "success", icon: IconCheck, label: "Aprobada" },
  rejected:  { variant: "error",   icon: IconClose, label: "Rechazada" },
  cancelled: { variant: "error",   icon: IconClose, label: "Cancelada" },
};

// ---------------------------------------------------------------------------
// Timeline builder
// ---------------------------------------------------------------------------

function buildTimeline(
  status: RequestStatusEnum,
  createdAt: string,
  reviewedAt: string | null,
) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const items: {
    id: string;
    title: string;
    date: string;
    status: "completed" | "current" | "pending" | "rejected";
    description?: string;
  }[] = [
    {
      id: "submitted",
      title: "Solicitud enviada",
      date: fmt(createdAt),
      status: "completed",
    },
  ];

  switch (status) {
    case "draft":
      items.push({ id: "pending", title: "Pendiente de envío", date: "Borrador", status: "current" });
      break;

    case "pending":
      items.push({ id: "review", title: "En revisión por RH", date: "En espera", status: "current" });
      break;

    case "approved":
      items.push({ id: "review",    title: "Revisada por RH",     date: reviewedAt ? fmt(reviewedAt) : "—", status: "completed" });
      items.push({ id: "approved",  title: "Solicitud aprobada",  date: reviewedAt ? fmt(reviewedAt) : "—", status: "completed" });
      break;

    case "rejected":
      items.push({ id: "review",   title: "Revisada por RH",     date: reviewedAt ? fmt(reviewedAt) : "—", status: "completed" });
      items.push({ id: "rejected", title: "Solicitud rechazada", date: reviewedAt ? fmt(reviewedAt) : "—", status: "rejected" });
      break;

    case "cancelled":
      items.push({ id: "cancelled", title: "Solicitud cancelada", date: fmt(reviewedAt ?? createdAt), status: "rejected" });
      break;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Metadata renderer
// ---------------------------------------------------------------------------

function formatFieldValue(
  value: unknown,
  field?: RequestTypeField,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (field?.type === "select" && field.options) {
    return field.options.find((o) => o.value === String(value))?.label ?? String(value);
  }
  if (field?.type === "number") return String(value);
  if (field?.type === "date") {
    const d = new Date(String(value));
    return isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  }
  return String(value);
}

function MetadataSection({
  typeCode,
  metadata,
}: {
  typeCode: string;
  metadata: Record<string, unknown>;
}) {
  const meta = getRequestTypeMeta(typeCode);

  const rows: { label: string; value: string }[] = [];

  if (meta) {
    for (const field of meta.fields) {
      if (field.type === "file") continue;
      const raw = metadata[field.key];
      const formatted = formatFieldValue(raw, field);
      if (formatted !== null) {
        rows.push({ label: field.label, value: formatted });
      }
    }
  } else {
    // Unknown type — show raw key-value pairs
    for (const [key, value] of Object.entries(metadata)) {
      const formatted = formatFieldValue(value);
      if (formatted !== null) {
        rows.push({ label: key, value: formatted });
      }
    }
  }

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Datos de la solicitud</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:gap-4 py-3 first:pt-0 last:pb-0"
            >
              <dt className="text-sm text-muted-foreground sm:w-48 shrink-0">{label}</dt>
              <dd className="text-sm text-foreground font-medium mt-0.5 sm:mt-0">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Attachments section
// ---------------------------------------------------------------------------

function AttachmentsSection({
  attachments,
}: {
  attachments: RequestDetailAttachment[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (attachment: RequestDetailAttachment) => {
    setLoadingId(attachment.id);
    setDownloadError(null);

    const { signedUrl, error } = await getSignedUrl(
      STORAGE_BUCKETS.ATTACHMENTS,
      attachment.storagePath,
      300, // 5-minute URL for immediate download
    );

    setLoadingId(null);

    if (error || !signedUrl) {
      setDownloadError("No se pudo generar el enlace de descarga. Inténtalo de nuevo.");
      return;
    }

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adjuntos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {downloadError && (
          <div className="mx-6 mb-4 flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error-border text-error-foreground text-sm">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}
        <ul className="divide-y divide-border">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between px-6 py-3 gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <IconInbox className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {att.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(att.fileSize)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(att)}
                isLoading={loadingId === att.id}
                disabled={loadingId !== null}
              >
                <IconDownload className="w-4 h-4 mr-1.5" />
                Descargar
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Review panel (HR / manager only — shown when request is pending)
// ---------------------------------------------------------------------------

const ACTION_CONFIG: Record<
  ReviewAction,
  { label: string; variant: "default" | "error" | "secondary"; notesRequired: boolean; notesLabel: string }
> = {
  approve: {
    label: "Aprobar",
    variant: "default",
    notesRequired: false,
    notesLabel: "Comentario para el colaborador (opcional)",
  },
  reject: {
    label: "Rechazar",
    variant: "error",
    notesRequired: true,
    notesLabel: "Motivo del rechazo (obligatorio)",
  },
  request_changes: {
    label: "Solicitar cambios",
    variant: "secondary",
    notesRequired: true,
    notesLabel: "Indica qué cambios se requieren (obligatorio)",
  },
};

function ReviewPanel({
  requestId,
  onSuccess,
}: {
  requestId: string;
  onSuccess: () => void;
}) {
  const [selectedAction, setSelectedAction] = useState<ReviewAction | null>(null);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!selectedAction) {
      setFormError("Selecciona una acción.");
      return;
    }

    const cfg = ACTION_CONFIG[selectedAction];
    if (cfg.notesRequired && !notes.trim()) {
      setFormError(cfg.notesLabel.replace(" (obligatorio)", "") + " es obligatorio.");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const result = await reviewRequest({
        requestId,
        action: selectedAction,
        notes: notes.trim() || undefined,
      });

      if (result.error) {
        setFormError(result.error);
        return;
      }

      onSuccess();
    });
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Revisión de solicitud</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action selector */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(ACTION_CONFIG) as [ReviewAction, typeof ACTION_CONFIG[ReviewAction]][]).map(
            ([action, cfg]) => (
              <button
                key={action}
                type="button"
                onClick={() => {
                  setSelectedAction(action);
                  setFormError(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedAction === action
                    ? action === "approve"
                      ? "bg-success text-success-foreground border-success"
                      : action === "reject"
                        ? "bg-error text-error-foreground border-error"
                        : "bg-muted text-foreground border-border"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                }`}
              >
                {action === "approve" && <IconCheck className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />}
                {action === "reject" && <IconClose className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />}
                {action === "request_changes" && <IconAlertCircle className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />}
                {cfg.label}
              </button>
            ),
          )}
        </div>

        {/* Notes textarea */}
        {selectedAction && (
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">
              {ACTION_CONFIG[selectedAction].notesLabel}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Escribe aquí tu comentario..."
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
            />
          </div>
        )}

        {/* Error */}
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error-foreground text-sm">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={!selectedAction || isPending}
          >
            Confirmar revisión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-32 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = typeof params.id === "string" ? params.id : null;

  const { profile } = useSession();
  const isReviewer =
    profile?.role === "hr_admin" ||
    profile?.role === "super_admin" ||
    profile?.role === "manager";

  const { request, isLoading, error, refetch } = useRequestDetail(requestId);

  if (isLoading) return <DetailSkeleton />;

  if (error || !request) {
    return (
      <div className="max-w-3xl">
        <Link
          href="/requests"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Mis solicitudes
        </Link>
        <Card className="mt-6 border-error-border bg-error/10">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mb-4">
              <IconAlertCircle className="w-8 h-8 text-error-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {error ?? "Solicitud no encontrada"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Verifica que el enlace sea correcto o que tengas acceso a esta solicitud.
            </p>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Volver
            </Button>
            <Button onClick={() => router.push("/requests")}>
              Mis solicitudes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[request.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const catalogMeta = getRequestTypeMeta(request.typeCode);
  const TypeIcon = catalogMeta?.icon ?? IconInbox;
  const iconBg = catalogMeta?.iconBg ?? "bg-muted";
  const timelineItems = buildTimeline(request.status, request.createdAt, request.reviewedAt);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back navigation */}
      <div>
        <Link
          href="/requests"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Mis solicitudes
        </Link>
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <TypeIcon className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{request.typeName}</h1>
            <Badge variant={status.variant}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          {request.typeDescription && (
            <p className="text-sm text-muted-foreground mt-1">{request.typeDescription}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Enviada el {fmt(request.createdAt)}
            {request.reviewedAt && ` · Revisada el ${fmt(request.reviewedAt)}`}
          </p>
        </div>
      </div>

      {/* Metadata fields */}
      <MetadataSection typeCode={request.typeCode} metadata={request.metadata} />

      {/* Employee notes */}
      {request.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas de la solicitud</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap">{request.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline / historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline items={timelineItems} />
        </CardContent>
      </Card>

      {/* HR reviewer notes */}
      {request.reviewerNotes && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Comentarios de RH</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {request.reviewerNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {request.attachments.length > 0 && (
        <AttachmentsSection attachments={request.attachments} />
      )}

      {/* Review panel — HR / manager only, only while pending */}
      {isReviewer && request.status === "pending" && requestId && (
        <ReviewPanel requestId={requestId} onSuccess={refetch} />
      )}
    </div>
  );
}
