"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import {
  IconSearch,
  IconClose,
  IconAlertCircle,
  IconChartBar,
  IconCalendar,
  IconCheck,
  IconClock,
  IconFileText,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useAuditLog,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/modules/audit/hooks/use-audit-log";
import type { AuditActionEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_OPTIONS: { value: "" | AuditActionEnum; label: string }[] = [
  { value: "", label: "Todas las acciones" },
  { value: "create", label: "Crear" },
  { value: "update", label: "Actualizar" },
  { value: "delete", label: "Eliminar" },
  { value: "approve", label: "Aprobar" },
  { value: "reject", label: "Rechazar" },
  { value: "upload", label: "Subir archivo" },
  { value: "download", label: "Descargar" },
  { value: "login", label: "Inicio de sesión" },
  { value: "logout", label: "Cierre de sesión" },
];

const RESOURCE_OPTIONS = [
  { value: "", label: "Todos los recursos" },
  { value: "request", label: "Solicitudes" },
  { value: "employee_document", label: "Expediente" },
  { value: "announcement", label: "Anuncios" },
  { value: "policy", label: "Reglamentos" },
];

const ACTION_STYLES: Record<
  AuditActionEnum,
  { variant: "success" | "error" | "warning" | "info" | "default"; label: string }
> = {
  create:   { variant: "success", label: "Crear" },
  update:   { variant: "warning", label: "Actualizar" },
  delete:   { variant: "error",   label: "Eliminar" },
  approve:  { variant: "success", label: "Aprobar" },
  reject:   { variant: "error",   label: "Rechazar" },
  upload:   { variant: "info",    label: "Subir" },
  download: { variant: "default", label: "Descargar" },
  login:    { variant: "default", label: "Login" },
  logout:   { variant: "default", label: "Logout" },
};

const RESOURCE_LABELS: Record<string, string> = {
  request:           "Solicitud",
  employee_document: "Expediente",
  announcement:      "Anuncio",
  policy:            "Reglamento",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.slice(0, 8) + "…";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionBadge({ action }: { action: AuditActionEnum }) {
  const cfg = ACTION_STYLES[action] ?? { variant: "default", label: action };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function MetadataView({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
      {entries.map(([k, v]) => (
        <span key={k} className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{k}:</span>{" "}
          {String(v).slice(0, 60)}
        </span>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 5, 6].map((i) => (
        <Card key={i} padding="none">
          <CardContent className="p-4 flex items-start gap-4">
            <Skeleton className="w-20 h-4 mt-1" />
            <Skeleton className="w-24 h-4 mt-1" />
            <Skeleton className="w-16 h-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AuditPage() {
  const { profile } = useSession();
  const router = useRouter();

  // Role guard — super_admin only (matches RLS policy)
  useEffect(() => {
    if (profile && profile.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  // --- Filters ---
  const [action, setAction] = useState<"" | AuditActionEnum>("");
  const [resource, setResource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters: AuditLogFilters = {
    action,
    resource,
    date_from: dateFrom,
    date_to: dateTo,
  };

  const { entries, isLoading, error, refetch } = useAuditLog(filters);

  const hasFilters = action || resource || dateFrom || dateTo;

  function clearFilters() {
    setAction("");
    setResource("");
    setDateFrom("");
    setDateTo("");
  }

  if (!profile || profile.role !== "super_admin") return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bitácora de Auditoría</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro inmutable de acciones sensibles. Solo accesible para Super Admin.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch}>
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-3">
          {/* Action */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Acción
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as "" | AuditActionEnum)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Resource */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recurso
            </label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {RESOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Date to */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="self-end">
              <IconClose className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </Card>

      {/* Summary bar */}
      {!isLoading && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconChartBar className="w-4 h-4" />
          {entries.length === 200
            ? "Mostrando los últimos 200 registros (límite de página)"
            : `${entries.length} registro${entries.length !== 1 ? "s" : ""} encontrado${entries.length !== 1 ? "s" : ""}`}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-error/10 border border-error-border text-sm text-error-foreground">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          Error al cargar la bitácora: {error}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<IconFileText className="w-10 h-10" />}
          title="Sin registros"
          description={
            hasFilters
              ? "No hay registros que coincidan con los filtros aplicados."
              : "La bitácora está vacía. Los registros aparecerán aquí conforme se realicen acciones."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Row
// ---------------------------------------------------------------------------

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <Card padding="none">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Timestamp */}
          <div className="flex items-center gap-1.5 shrink-0 sm:w-36">
            <IconClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground font-mono">
              {formatDateTime(entry.createdAt)}
            </span>
          </div>

          {/* Actor */}
          <div className="shrink-0 sm:w-32 truncate">
            <span className="text-sm font-medium text-foreground">{entry.actorName}</span>
          </div>

          {/* Action badge */}
          <div className="shrink-0">
            <ActionBadge action={entry.action} />
          </div>

          {/* Resource + ID */}
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
              {RESOURCE_LABELS[entry.resource] ?? entry.resource}
            </span>
            {entry.resourceId && (
              <span className="text-xs text-muted-foreground font-mono">
                #{shortId(entry.resourceId)}
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <MetadataView metadata={entry.metadata} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
