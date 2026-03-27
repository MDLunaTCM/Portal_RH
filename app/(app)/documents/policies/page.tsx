"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import { Select } from "@/components/ui/shared";
import {
  IconDocument,
  IconSearch,
  IconDownload,
  IconAlertCircle,
  IconInbox,
  IconCalendar,
  IconFileText,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  usePolicies,
  type PolicyFilters,
} from "@/modules/policies/hooks/use-policies";
import { POLICY_CATEGORIES, type Policy } from "@/modules/policies/types";
import { getSignedUrl } from "@/modules/storage/actions";
import { STORAGE_BUCKETS } from "@/modules/storage/paths";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_VARIANT: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  Reglamentos:    "error",
  Manuales:       "info",
  Procedimientos: "warning",
  Beneficios:     "success",
  Seguridad:      "default",
};

// ---------------------------------------------------------------------------
// PolicyCard
// ---------------------------------------------------------------------------

function PolicyCard({
  policy,
  onDownload,
  isDownloading,
}: {
  policy: Policy;
  onDownload: (policy: Policy) => void;
  isDownloading: boolean;
}) {
  const categoryVariant = CATEGORY_VARIANT[policy.category] ?? "default";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={categoryVariant}>{policy.category}</Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              v{policy.version}
            </Badge>
          </div>
          {policy.storagePath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(policy)}
              disabled={isDownloading}
              leftIcon={<IconDownload className="w-4 h-4" />}
            >
              {isDownloading ? "Abriendo…" : "Descargar"}
            </Button>
          )}
        </div>

        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <IconFileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-snug">
              {policy.title}
            </p>
            {policy.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {policy.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
          <div className="flex items-center gap-1">
            <IconCalendar className="w-3.5 h-3.5" />
            <span>Publicado el {formatDate(policy.publishedAt)}</span>
          </div>
          {policy.fileSize && (
            <span className="ml-auto">{formatFileSize(policy.fileSize)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PoliciesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-[180px]" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-border space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PoliciesPage() {
  const { isLoading: sessionLoading } = useSession();

  const [filters, setFilters] = useState<PolicyFilters>({ search: "", category: "" });
  const { policies, isLoading, error, refetch } = usePolicies(filters);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasFilters = !!filters.search || !!filters.category;

  function clearFilters() {
    setFilters({ search: "", category: "" });
  }

  async function handleDownload(policy: Policy) {
    if (!policy.storagePath) return;
    setDownloadError(null);
    setDownloadingId(policy.id);

    startTransition(async () => {
      const { signedUrl, error: urlError } = await getSignedUrl(
        STORAGE_BUCKETS.POLICIES,
        policy.storagePath!,
        3600,
      );

      setDownloadingId(null);

      if (urlError || !signedUrl) {
        setDownloadError("No se pudo generar el enlace de descarga. Inténtalo de nuevo.");
        return;
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    });
  }

  if (sessionLoading || isLoading) return <PoliciesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reglamentos y Documentos</h1>
          <p className="text-muted-foreground">
            Políticas, manuales y procedimientos publicados por la empresa.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconDocument className="w-4 h-4" />
          <span>{policies.length} documentos</span>
        </div>
      </div>

      {/* Error loading */}
      {error && (
        <Card className="border-error-border bg-error/10">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center shrink-0">
              <IconAlertCircle className="w-5 h-5 text-error-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Error al cargar documentos</p>
              <p className="text-xs text-muted-foreground truncate">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Download error */}
      {downloadError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error-border text-error-foreground text-sm">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{downloadError}</span>
          <button
            type="button"
            onClick={() => setDownloadError(null)}
            className="text-xs underline hover:no-underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Buscar por título o descripción…"
                className="pl-9"
              />
            </div>

            <Select
              placeholder="Todas las categorías"
              options={POLICY_CATEGORIES.map((c) => ({ value: c, label: c }))}
              value={filters.category}
              onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
              className="w-44"
            />

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Grid */}
          {policies.length === 0 ? (
            <EmptyState
              icon={<IconInbox className="w-10 h-10" />}
              title={hasFilters ? "Sin resultados" : "Sin documentos publicados"}
              description={
                hasFilters
                  ? "Prueba con otros filtros de búsqueda."
                  : "No hay reglamentos ni documentos publicados en este momento."
              }
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {policies.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onDownload={handleDownload}
                  isDownloading={downloadingId === policy.id || isPending}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
