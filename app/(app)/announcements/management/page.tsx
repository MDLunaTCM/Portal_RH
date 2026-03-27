"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Tabs,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { Modal, Select, Textarea, DatePicker } from "@/components/ui/shared";
import {
  IconMegaphone,
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconGlobe,
  IconCheck,
  IconClose,
  IconAlertCircle,
  IconClock,
  IconCalendar,
  IconFileText,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useHRAnnouncements,
  type HRAnnouncement,
  type HRAnnouncementFilters,
} from "@/modules/announcements/hooks/use-hr-announcements";
import {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
  deleteAnnouncement,
  type AnnouncementInput,
} from "@/modules/announcements/actions";
import type { UserRoleEnum, PublishStatusEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ["General", "Eventos", "Beneficios", "Avisos", "Urgente"] as const;

const ROLE_LABELS: Record<UserRoleEnum, string> = {
  employee: "Colaboradores",
  manager: "Managers",
  hr_admin: "RH",
  super_admin: "Super Admin",
};

const STATUS_CONFIG: Record<
  PublishStatusEnum,
  { label: string; variant: "success" | "warning" | "default" | "error"; icon: React.ReactNode }
> = {
  published: {
    label: "Publicado",
    variant: "success",
    icon: <IconCheck className="w-3.5 h-3.5" />,
  },
  draft: {
    label: "Borrador",
    variant: "warning",
    icon: <IconClock className="w-3.5 h-3.5" />,
  },
  archived: {
    label: "Archivado",
    variant: "default",
    icon: <IconCalendar className="w-3.5 h-3.5" />,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: PublishStatusEnum }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} padding="none">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Announcement Form (inside Modal)
// ---------------------------------------------------------------------------

interface AnnouncementFormProps {
  initial?: HRAnnouncement | null;
  onSubmit: (values: AnnouncementInput & { publish_immediately?: boolean }) => void;
  isPending: boolean;
  error: string | null;
}

function AnnouncementForm({ initial, onSubmit, isPending, error }: AnnouncementFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "General");
  const [targetRoles, setTargetRoles] = useState<UserRoleEnum[]>(
    initial?.targetRoles ?? [],
  );
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt?.slice(0, 10) ?? "");
  const [publishImmediately, setPublishImmediately] = useState(false);

  const toggleRole = (role: UserRoleEnum) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      body,
      category,
      target_roles: targetRoles,
      pinned,
      expires_at: expiresAt || null,
      publish_immediately: publishImmediately,
    });
  };

  return (
    <form id="announcement-form" onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <Input
        label="Título *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título del anuncio"
        required
        maxLength={200}
      />

      {/* Body */}
      <Textarea
        label="Contenido *"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escribe el contenido del anuncio…"
        required
        rows={5}
      />

      {/* Category + Pinned row */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Categoría"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          value={category}
          onChange={(v) => setCategory(v)}
        />
        <DatePicker
          label="Vence el"
          value={expiresAt}
          onChange={(v) => setExpiresAt(v)}
        />
      </div>

      {/* Target roles */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Audiencia{" "}
          <span className="text-xs text-muted-foreground font-normal">(vacío = todos)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABELS) as UserRoleEnum[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                targetRoles.includes(role)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="w-4 h-4 rounded border-input accent-primary"
          />
          <span className="text-sm text-foreground">Fijar en el tablón (aparece primero)</span>
        </label>

        {/* Publish immediately only for new announcements */}
        {!initial && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary"
            />
            <span className="text-sm text-foreground">Publicar inmediatamente</span>
          </label>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error-border text-sm text-error-foreground">
          <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit button in footer (outside form) — rendered via Modal footer prop */}
      <button type="submit" form="announcement-form" className="hidden" disabled={isPending} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type TabStatus = "all" | "published" | "draft" | "archived";

export default function AnnouncementsManagementPage() {
  const { profile, isLoading: sessionLoading } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Role guard — redirect non-HR users
  useEffect(() => {
    if (profile && profile.role !== "hr_admin" && profile.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<TabStatus>("all");

  // --- Filters ---
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Hook with active tab status filter for the display list
  const displayFilters: HRAnnouncementFilters = {
    status: activeTab === "all" ? "" : activeTab,
    search,
    category,
  };
  const { announcements, isLoading, error, refetch } = useHRAnnouncements(displayFilters);

  // Hook without status filter for accurate tab counts
  const allDocs = useHRAnnouncements({ status: "", search: "", category: "" });

  // --- Counts per tab ---
  const counts = {
    all: allDocs.announcements.length,
    published: allDocs.announcements.filter((a) => a.status === "published").length,
    draft: allDocs.announcements.filter((a) => a.status === "draft").length,
    archived: allDocs.announcements.filter((a) => a.status === "archived").length,
  };

  // --- Modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<HRAnnouncement | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Delete confirmation state ---
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Success notice ---
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setEditingAnnouncement(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(a: HRAnnouncement) {
    setEditingAnnouncement(a);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (!isPending) {
      setModalOpen(false);
      setEditingAnnouncement(null);
      setFormError(null);
    }
  }

  function handleFormSubmit(values: AnnouncementInput & { publish_immediately?: boolean }) {
    setFormError(null);
    startTransition(async () => {
      if (editingAnnouncement) {
        const res = await updateAnnouncement(editingAnnouncement.id, {
          title: values.title,
          body: values.body,
          category: values.category,
          target_roles: values.target_roles,
          pinned: values.pinned,
          expires_at: values.expires_at,
        });
        if (res.error) { setFormError(res.error); return; }
        setSuccessMsg("Anuncio actualizado correctamente.");
      } else {
        const res = await createAnnouncement(values);
        if (res.error) { setFormError(res.error); return; }
        setSuccessMsg(
          values.publish_immediately
            ? "Anuncio creado y publicado."
            : "Anuncio guardado como borrador.",
        );
      }
      setModalOpen(false);
      setEditingAnnouncement(null);
      refetch();
      allDocs.refetch();
    });
  }

  function handlePublish(id: string) {
    startTransition(async () => {
      const res = await publishAnnouncement(id);
      if (res.error) { setSuccessMsg(null); return; }
      setSuccessMsg("Anuncio publicado.");
      refetch();
      allDocs.refetch();
    });
  }

  function handleUnpublish(id: string) {
    startTransition(async () => {
      const res = await unpublishAnnouncement(id);
      if (res.error) { setSuccessMsg(null); return; }
      setSuccessMsg("Anuncio despublicado.");
      refetch();
      allDocs.refetch();
    });
  }

  function handleDeleteConfirm(id: string) {
    startTransition(async () => {
      const res = await deleteAnnouncement(id);
      setDeletingId(null);
      if (res.error) return;
      setSuccessMsg("Anuncio eliminado.");
      refetch();
      allDocs.refetch();
    });
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
  }

  const hasFilters = search || category;

  if (!sessionLoading && profile && profile.role !== "hr_admin" && profile.role !== "super_admin") {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de anuncios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea, edita y controla la publicación de anuncios internos.
          </p>
        </div>
        <Button
          onClick={openCreate}
          leftIcon={<IconPlus className="w-4 h-4" />}
          size="sm"
        >
          Nuevo anuncio
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Success notice */}
      {/* ------------------------------------------------------------------ */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success-border text-sm text-success-foreground">
          <IconCheck className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Stats */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.all, icon: <IconFileText className="w-5 h-5" />, color: "text-foreground" },
          { label: "Publicados", value: counts.published, icon: <IconGlobe className="w-5 h-5" />, color: "text-success-foreground" },
          { label: "Borradores", value: counts.draft, icon: <IconClock className="w-5 h-5" />, color: "text-warning-foreground" },
          { label: "Archivados", value: counts.archived, icon: <IconCalendar className="w-5 h-5" />, color: "text-muted-foreground" },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
              <div>
                <p className="text-xl font-bold text-foreground">{allDocs.isLoading ? "—" : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tabs */}
      {/* ------------------------------------------------------------------ */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabStatus)}
        tabs={[
          { id: "all", label: "Todos", count: counts.all },
          { id: "published", label: "Publicados", count: counts.published },
          { id: "draft", label: "Borradores", count: counts.draft },
          { id: "archived", label: "Archivados", count: counts.archived },
        ]}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Filters */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título…"
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
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <IconClose className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* List */}
      {/* ------------------------------------------------------------------ */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-error/10 border border-error-border text-sm text-error-foreground">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          Error al cargar anuncios: {error}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<IconMegaphone className="w-10 h-10" />}
          title={hasFilters ? "Sin resultados" : "Sin anuncios"}
          description={
            hasFilters
              ? "Ningún anuncio coincide con los filtros aplicados."
              : activeTab === "draft"
              ? "No hay borradores pendientes."
              : activeTab === "published"
              ? "No hay anuncios publicados en este momento."
              : "Crea el primer anuncio para el tablón."
          }
          action={
            !hasFilters && activeTab === "all" ? (
              <Button onClick={openCreate} size="sm" leftIcon={<IconPlus className="w-4 h-4" />}>
                Nuevo anuncio
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <AnnouncementRow
              key={a.id}
              announcement={a}
              isPending={isPending}
              deletingId={deletingId}
              onEdit={() => openEdit(a)}
              onPublish={() => handlePublish(a.id)}
              onUnpublish={() => handleUnpublish(a.id)}
              onDeleteRequest={() => setDeletingId(a.id)}
              onDeleteConfirm={() => handleDeleteConfirm(a.id)}
              onDeleteCancel={() => setDeletingId(null)}
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Create / Edit Modal */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingAnnouncement ? "Editar anuncio" : "Nuevo anuncio"}
        description={
          editingAnnouncement
            ? "Modifica el contenido o la configuración del anuncio."
            : "Completa el formulario para crear un nuevo anuncio."
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" size="sm" onClick={closeModal} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="announcement-form"
              size="sm"
              isLoading={isPending}
            >
              {editingAnnouncement ? "Guardar cambios" : "Crear anuncio"}
            </Button>
          </div>
        }
      >
        <AnnouncementForm
          initial={editingAnnouncement}
          onSubmit={handleFormSubmit}
          isPending={isPending}
          error={formError}
        />
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Announcement Row
// ---------------------------------------------------------------------------

interface AnnouncementRowProps {
  announcement: HRAnnouncement;
  isPending: boolean;
  deletingId: string | null;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function AnnouncementRow({
  announcement: a,
  isPending,
  deletingId,
  onEdit,
  onPublish,
  onUnpublish,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: AnnouncementRowProps) {
  const isDeleting = deletingId === a.id;

  return (
    <Card padding="none">
      <CardContent className="p-4">
        {isDeleting ? (
          /* Inline delete confirmation */
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <IconAlertCircle className="w-4 h-4 text-destructive shrink-0" />
              ¿Eliminar{" "}
              <span className="font-medium">"{a.title}"</span>? Esta acción no se puede
              deshacer.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={onDeleteCancel} disabled={isPending}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" isLoading={isPending} onClick={onDeleteConfirm}>
                Eliminar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left: title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {a.pinned && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                    Fijado
                  </span>
                )}
                <span className="font-medium text-foreground truncate">{a.title}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {a.category}
                </span>
                {a.targetRoles.length > 0 ? (
                  a.targetRoles.map((r) => (
                    <span key={r} className="text-xs text-muted-foreground">
                      {ROLE_LABELS[r]}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Todos</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {a.publishedAt
                    ? `Publicado ${formatDate(a.publishedAt)}`
                    : `Creado ${formatDate(a.createdAt)}`}
                </span>
              </div>
            </div>

            {/* Right: status + actions */}
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={a.status} />

              {/* Publish / Unpublish */}
              {a.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isPending}
                  onClick={onPublish}
                  leftIcon={<IconGlobe className="w-3.5 h-3.5" />}
                >
                  Publicar
                </Button>
              )}
              {a.status === "published" && (
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={isPending}
                  onClick={onUnpublish}
                >
                  Despublicar
                </Button>
              )}

              {/* Edit */}
              <button
                onClick={onEdit}
                disabled={isPending}
                title="Editar"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <IconEdit className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={onDeleteRequest}
                disabled={isPending}
                title="Eliminar"
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
