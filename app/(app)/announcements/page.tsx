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
import { Select } from "@/components/ui/shared";
import {
  IconSearch,
  IconAlertCircle,
  IconInbox,
  IconBell,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useAnnouncementsBoard,
  type BoardAnnouncement,
} from "@/modules/announcements/hooks/use-announcements-board";
import { FeedPost } from "@/components/announcements/FeedPost";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ["General", "Eventos", "Beneficios", "Avisos", "Urgente"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 7;
}

// ---------------------------------------------------------------------------
// Loading skeleton (Feed style)
// ---------------------------------------------------------------------------

function BoardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-[180px]" />
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Feed skeleton - vertical stack */}
      <div className="space-y-4 max-w-2xl mx-auto w-full">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border overflow-hidden space-y-4 p-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
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
      {/* Page header - centered for feed layout */}
      <div className="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-foreground">Tablón de Anuncios</h1>
          <p className="text-muted-foreground mt-1">
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
          {/* Filters - centered */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto w-full">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
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

          {/* Facebook-style Vertical Feed */}
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
            <div className="max-w-3xl mx-auto w-full">
              {filtered.map((a) => (
                <FeedPost
                  key={a.id}
                  announcement={a}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
