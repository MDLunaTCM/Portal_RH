"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import { Select, Modal } from "@/components/ui/shared";
import {
  IconMegaphone,
  IconSearch,
  IconCalendar,
  IconAlertCircle,
  IconInbox,
  IconBell,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useAnnouncementsBoard,
  type BoardAnnouncement,
} from "@/modules/announcements/hooks/use-announcements-board";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ["General", "Eventos", "Beneficios", "Avisos", "Urgente"] as const;

const CATEGORY_VARIANT: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  General:    "info",
  Eventos:    "success",
  Beneficios: "default",
  Avisos:     "warning",
  Urgente:    "error",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 7;
}

// ---------------------------------------------------------------------------
// AnnouncementCard
// ---------------------------------------------------------------------------

function AnnouncementCard({
  announcement,
  onClick,
}: {
  announcement: BoardAnnouncement;
  onClick: () => void;
}) {
  const expiringSoon = isExpiringSoon(announcement.expiresAt);
  const categoryVariant = CATEGORY_VARIANT[announcement.category] ?? "default";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border bg-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-primary/50 hover:shadow-md ${
        announcement.pinned ? "border-primary/40 bg-primary/5" : "border-border"
      }`}
    >
      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Badge variant={categoryVariant}>{announcement.category}</Badge>
        {announcement.pinned && <Badge variant="warning">Fijado</Badge>}
        {expiringSoon && <Badge variant="error">Vence pronto</Badge>}
      </div>

      {/* Title */}
      <p className="font-semibold text-foreground leading-snug mb-1.5">
        {announcement.title}
      </p>

      {/* Excerpt */}
      <p className="text-sm text-muted-foreground line-clamp-3">
        {announcement.body.length > 180
          ? announcement.body.slice(0, 177).trimEnd() + "…"
          : announcement.body}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
        <IconCalendar className="w-3.5 h-3.5" />
        <span>{formatDate(announcement.publishedAt)}</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function BoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-[180px]" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-border space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error card
// ---------------------------------------------------------------------------

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-error-border bg-error/10">
      <CardContent className="flex items-center gap-3 py-4">
        <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center shrink-0">
          <IconAlertCircle className="w-5 h-5 text-error-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">Error al cargar anuncios</p>
          <p className="text-xs text-muted-foreground truncate">{message}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnnouncementsPage() {
  const { profile, isLoading: sessionLoading } = useSession();
  const role = profile?.role ?? null;

  const { announcements, isLoading, error, refetch } = useAnnouncementsBoard(role);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<BoardAnnouncement | null>(null);

  const filtered = useMemo(() => {
    let result = announcements;

    if (category) {
      result = result.filter((a) => a.category === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.body.toLowerCase().includes(q),
      );
    }

    return result;
  }, [announcements, search, category]);

  const hasFilters = !!search || !!category;

  if (sessionLoading || isLoading) return <BoardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tablón de Anuncios</h1>
          <p className="text-muted-foreground">
            Comunicados y avisos publicados por Recursos Humanos.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconBell className="w-4 h-4" />
          <span>{announcements.length} publicaciones</span>
        </div>
      </div>

      {/* Error */}
      {error && <ErrorCard message={error} onRetry={refetch} />}

      {!error && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título o contenido…"
                className="pl-9"
              />
            </div>

            <Select
              placeholder="Todas las categorías"
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              value={category}
              onChange={(v) => setCategory(v)}
              className="w-44"
            />

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setCategory(""); }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<IconInbox className="w-10 h-10" />}
              title={hasFilters ? "Sin resultados" : "Sin anuncios publicados"}
              description={
                hasFilters
                  ? "Prueba con otros filtros de búsqueda."
                  : "No hay anuncios publicados en este momento."
              }
              action={
                hasFilters ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setSearch(""); setCategory(""); }}
                  >
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  onClick={() => setSelected(a)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        size="lg"
      >
        {selected && (
          <div className="space-y-4 px-6 pb-6">
            {/* Meta row */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={CATEGORY_VARIANT[selected.category] ?? "default"}>
                {selected.category}
              </Badge>
              {selected.pinned && <Badge variant="warning">Fijado</Badge>}
            </div>

            <p className="text-sm text-muted-foreground">
              Publicado el {formatDate(selected.publishedAt)}
              {selected.expiresAt && (
                <> · Vence el {formatDate(selected.expiresAt)}</>
              )}
            </p>

            <div className="pt-2 border-t border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {selected.body}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
