"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import {
  IconSearch,
  IconAlertCircle,
  IconInbox,
  IconBell,
  IconMegaphone,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useAnnouncementsBoard,
} from "@/modules/announcements/hooks/use-announcements-board";
import { FeedPost } from "@/components/announcements/FeedPost";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "General", label: "General" },
  { value: "Eventos", label: "Eventos" },
  { value: "Beneficios", label: "Beneficios" },
  { value: "Avisos", label: "Avisos" },
  { value: "Urgente", label: "Urgente" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 7;
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function PostSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden mb-3">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="flex border-t border-border/40">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-1 h-10 rounded-none" />
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error card
// ---------------------------------------------------------------------------

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-error-border bg-error/10 rounded-xl">
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
// Right sidebar
// ---------------------------------------------------------------------------

function AnnouncementsSidebar({
  total,
  pinned,
  expiringSoon,
  category,
  onCategoryChange,
}: {
  total: number;
  pinned: number;
  expiringSoon: number;
  category: string;
  onCategoryChange: (v: string) => void;
}) {
  return (
    <aside className="space-y-4">
      {/* Company / HR card */}
      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-primary/80 to-primary/40 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          />
        </div>
        {/* Avatar + info */}
        <div className="px-4 pb-4 -mt-6">
          <div className="w-12 h-12 rounded-full bg-primary ring-4 ring-card flex items-center justify-center mb-2 shadow-sm">
            <span className="text-xs font-extrabold text-primary-foreground tracking-widest">RH</span>
          </div>
          <p className="text-sm font-semibold text-foreground">Recursos Humanos</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comunicados oficiales de la empresa
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div>
              <p className="text-base font-bold text-foreground">{total}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Publicados</p>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">{pinned}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Fijados</p>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">{expiringSoon}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Por vencer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Categorías
        </p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left",
                category === cat.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-muted/60",
              )}
            >
              <span>{cat.label}</span>
              {category === cat.value && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tip / info */}
      <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Los anuncios urgentes o importantes serán notificados por correo electrónico.
        </p>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Pinned story chips (horizontal scroll)
// ---------------------------------------------------------------------------

function PinnedStrip({ announcements }: { announcements: Array<{ id: string; title: string }> }) {
  if (!announcements.length) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground flex-shrink-0">
        <IconMegaphone className="w-3.5 h-3.5" />
        Fijados
      </div>
      {announcements.map((a) => (
        <span
          key={a.id}
          className="flex-shrink-0 text-xs bg-warning/10 text-warning-foreground font-medium px-3 py-1.5 rounded-full border border-warning/20 max-w-[160px] truncate"
        >
          {a.title}
        </span>
      ))}
    </div>
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

  const pinnedAnnouncements = useMemo(
    () => announcements.filter((a) => a.pinned),
    [announcements],
  );

  const expiringSoonCount = useMemo(
    () => announcements.filter((a) => isExpiringSoon(a.expiresAt ?? null)).length,
    [announcements],
  );

  const hasFilters = !!search || !!category;

  if (sessionLoading || isLoading) {
    return (
      <div className="max-w-[1080px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
          <div className="max-w-[640px] mx-auto xl:mx-0 w-full space-y-3">
            {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
          </div>
          <div className="hidden xl:block">
            <SidebarSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tablón de Anuncios</h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <IconBell className="w-3.5 h-3.5" />
            {announcements.length} publicaciones de Recursos Humanos
          </p>
        </div>
      </div>

      {error && <ErrorCard message={error} onRetry={refetch} />}

      {!error && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
          {/* ── Main feed column ── */}
          <div className="max-w-[640px] mx-auto xl:mx-0 w-full">
            {/* Search bar */}
            <div className="relative mb-4">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar anuncios…"
                className="pl-9 rounded-full bg-muted/50 border-border/60"
              />
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setCategory(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Pinned strip */}
            <div className="mb-4">
              <PinnedStrip announcements={pinnedAnnouncements} />
            </div>

            {/* Active category pill */}
            {category && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Filtrando por:</span>
                <button
                  onClick={() => setCategory("")}
                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {category}
                  <span className="text-base leading-none">×</span>
                </button>
              </div>
            )}

            {/* Feed posts */}
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
              <div>
                {filtered.map((a) => (
                  <FeedPost key={a.id} announcement={a} />
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="hidden xl:block sticky top-4">
            <AnnouncementsSidebar
              total={announcements.length}
              pinned={pinnedAnnouncements.length}
              expiringSoon={expiringSoonCount}
              category={category}
              onCategoryChange={setCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
}
