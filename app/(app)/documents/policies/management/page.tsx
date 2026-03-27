"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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
import { Modal, Select, Textarea } from "@/components/ui/shared";
import {
  IconDocument,
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
  IconDownload,
  IconFileText,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useHRPolicies,
  type HRPolicyFilters,
} from "@/modules/policies/hooks/use-hr-policies";
import {
  createPolicy,
  updatePolicyMetadata,
  publishPolicy,
  unpublishPolicy,
  deletePolicy,
} from "@/modules/policies/actions";
import { getSignedUrl } from "@/modules/storage/actions";
import { STORAGE_BUCKETS } from "@/modules/storage/paths";
import { POLICY_CATEGORIES } from "@/modules/policies/types";
import type { Policy } from "@/modules/policies/types";
import type { PublishStatusEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  PublishStatusEnum,
  { label: string; variant: "success" | "warning" | "default"; icon: React.ReactNode }
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

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getMimeLabel(type: string | null): string {
  if (!type) return "Documento";
  if (type === "application/pdf") return "PDF";
  if (type.includes("wordprocessingml") || type.includes("msword")) return "DOCX";
  return "Documento";
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
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policy Form (inside Modal)
// ---------------------------------------------------------------------------

interface PolicyFormProps {
  initial?: Policy | null;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
}

function PolicyForm({ initial, onSubmit, isPending, error }: PolicyFormProps) {
  const isEditing = !!initial;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? POLICY_CATEGORIES[0]);
  const [version, setVersion] = useState(initial?.version ?? "1.0");
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (!isEditing) {
      const file = fileInputRef.current?.files?.[0];
      if (!file || file.size === 0) {
        setFileError("Debes adjuntar un archivo PDF o DOCX.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("version", version);
    formData.append("publish_immediately", String(publishImmediately));

    const file = fileInputRef.current?.files?.[0];
    if (file) formData.append("file", file);

    onSubmit(formData);
  };

  return (
    <form id="policy-form" onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <Input
        label="Título *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ej. Reglamento Interno de Trabajo 2025"
        required
        maxLength={200}
      />

      {/* Description */}
      <Textarea
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Breve descripción del documento…"
        rows={3}
      />

      {/* Category + Version row */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Categoría"
          options={POLICY_CATEGORIES.map((c) => ({ value: c, label: c }))}
          value={category}
          onChange={(v) => setCategory(v)}
        />
        <Input
          label="Versión"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="1.0"
          maxLength={20}
        />
      </div>

      {/* File upload */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Archivo{" "}
          {isEditing ? (
            <span className="text-xs text-muted-foreground font-normal">
              (deja vacío para mantener el actual)
            </span>
          ) : (
            <span className="text-destructive">*</span>
          )}
        </label>

        {/* Existing file info for edits */}
        {isEditing && initial?.fileName && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
            <IconFileText className="w-4 h-4 shrink-0" />
            <span className="truncate">{initial.fileName}</span>
            <span className="shrink-0 text-xs">
              {getMimeLabel(initial.fileType)} · {formatBytes(initial.fileSize)}
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="block w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
        />
        {fileError && (
          <p className="text-xs text-error-foreground flex items-center gap-1">
            <IconAlertCircle className="w-3.5 h-3.5" />
            {fileError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">PDF o DOCX — máximo 50 MB</p>
      </div>

      {/* Publish immediately — new only */}
      {!isEditing && (
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error-border text-sm text-error-foreground">
          <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Hidden submit trigger — real button is in Modal footer */}
      <button type="submit" form="policy-form" className="hidden" disabled={isPending} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type TabStatus = "all" | "published" | "draft" | "archived";

export default function PoliciesManagementPage() {
  const { profile, isLoading: sessionLoading } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Role guard — redirect non-HR users
  useEffect(() => {
    if (profile && profile.role !== "hr_admin" && profile.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  // --- Tabs ---
  const [activeTab, setActiveTab] = useState<TabStatus>("all");

  // --- Filters ---
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Display hook (with tab status filter)
  const displayFilters: HRPolicyFilters = {
    status: activeTab === "all" ? "" : activeTab,
    search,
    category,
  };
  const { policies, isLoading, error, refetch } = useHRPolicies(displayFilters);

  // Count hook (no filters — for tab counters)
  const allPolicies = useHRPolicies({ status: "", search: "", category: "" });

  const counts = {
    all:       allPolicies.policies.length,
    published: allPolicies.policies.filter((p) => p.status === "published").length,
    draft:     allPolicies.policies.filter((p) => p.status === "draft").length,
    archived:  allPolicies.policies.filter((p) => p.status === "archived").length,
  };

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Delete confirmation ---
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
    setEditingPolicy(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(p: Policy) {
    setEditingPolicy(p);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (!isPending) {
      setModalOpen(false);
      setEditingPolicy(null);
      setFormError(null);
    }
  }

  function handleFormSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      if (editingPolicy) {
        // Metadata-only update
        const res = await updatePolicyMetadata(editingPolicy.id, {
          title:       formData.get("title") as string,
          description: (formData.get("description") as string) || null,
          category:    formData.get("category") as string,
          version:     (formData.get("version") as string) || "1.0",
        });
        if (res.error) { setFormError(res.error); return; }
        setSuccessMsg("Documento actualizado.");
      } else {
        const res = await createPolicy(formData);
        if (res.error) { setFormError(res.error); return; }
        const wasPublished = formData.get("publish_immediately") === "true";
        setSuccessMsg(wasPublished ? "Documento creado y publicado." : "Documento guardado como borrador.");
      }
      setModalOpen(false);
      setEditingPolicy(null);
      refetch();
      allPolicies.refetch();
    });
  }

  function handlePublish(id: string) {
    startTransition(async () => {
      const res = await publishPolicy(id);
      if (!res.error) { setSuccessMsg("Documento publicado."); refetch(); allPolicies.refetch(); }
    });
  }

  function handleUnpublish(id: string) {
    startTransition(async () => {
      const res = await unpublishPolicy(id);
      if (!res.error) { setSuccessMsg("Documento despublicado."); refetch(); allPolicies.refetch(); }
    });
  }

  function handleDeleteConfirm(policy: Policy) {
    startTransition(async () => {
      const res = await deletePolicy(policy.id, policy.storagePath);
      setDeletingId(null);
      if (!res.error) { setSuccessMsg("Documento eliminado."); refetch(); allPolicies.refetch(); }
    });
  }

  async function handleDownload(storagePath: string, fileName: string) {
    const { signedUrl, error: urlError } = await getSignedUrl(
      STORAGE_BUCKETS.POLICIES,
      storagePath,
      300, // 5-minute link
    );
    if (urlError || !signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = fileName;
    a.click();
  }

  const hasFilters = search || category;

  if (!sessionLoading && profile && profile.role !== "hr_admin" && profile.role !== "super_admin") {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reglamentos y Políticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sube, organiza y publica documentos institucionales para los colaboradores.
          </p>
        </div>
        <Button
          onClick={openCreate}
          leftIcon={<IconPlus className="w-4 h-4" />}
          size="sm"
        >
          Nuevo documento
        </Button>
      </div>

      {/* Success notice */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success-border text-sm text-success-foreground">
          <IconCheck className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",      value: counts.all,       icon: <IconDocument className="w-5 h-5" />,  color: "text-foreground" },
          { label: "Publicados", value: counts.published,  icon: <IconGlobe className="w-5 h-5" />,    color: "text-success-foreground" },
          { label: "Borradores", value: counts.draft,      icon: <IconClock className="w-5 h-5" />,    color: "text-warning-foreground" },
          { label: "Archivados", value: counts.archived,   icon: <IconCalendar className="w-5 h-5" />, color: "text-muted-foreground" },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {allPolicies.isLoading ? "—" : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabStatus)}
        tabs={[
          { id: "all",       label: "Todos",      count: counts.all },
          { id: "published", label: "Publicados", count: counts.published },
          { id: "draft",     label: "Borradores", count: counts.draft },
          { id: "archived",  label: "Archivados", count: counts.archived },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o descripción…"
            className="pl-9"
          />
        </div>

        <Select
          placeholder="Todas las categorías"
          options={POLICY_CATEGORIES.map((c) => ({ value: c, label: c }))}
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
            <IconClose className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-error/10 border border-error-border text-sm text-error-foreground">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          Error al cargar documentos: {error}
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          icon={<IconDocument className="w-10 h-10" />}
          title={hasFilters ? "Sin resultados" : "Sin documentos"}
          description={
            hasFilters
              ? "Ningún documento coincide con los filtros aplicados."
              : activeTab === "draft"
              ? "No hay borradores pendientes."
              : activeTab === "published"
              ? "No hay documentos publicados."
              : "Sube el primer reglamento o política."
          }
          action={
            !hasFilters && activeTab === "all" ? (
              <Button onClick={openCreate} size="sm" leftIcon={<IconPlus className="w-4 h-4" />}>
                Nuevo documento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <PolicyRow
              key={p.id}
              policy={p}
              isPending={isPending}
              deletingId={deletingId}
              onEdit={() => openEdit(p)}
              onPublish={() => handlePublish(p.id)}
              onUnpublish={() => handleUnpublish(p.id)}
              onDeleteRequest={() => setDeletingId(p.id)}
              onDeleteConfirm={() => handleDeleteConfirm(p)}
              onDeleteCancel={() => setDeletingId(null)}
              onDownload={
                p.storagePath && p.fileName
                  ? () => handleDownload(p.storagePath!, p.fileName!)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingPolicy ? "Editar documento" : "Nuevo documento"}
        description={
          editingPolicy
            ? "Modifica los metadatos del documento. El archivo no se reemplaza desde aquí."
            : "Completa el formulario y adjunta el archivo para crear el documento."
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" size="sm" onClick={closeModal} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="policy-form"
              size="sm"
              isLoading={isPending}
            >
              {editingPolicy ? "Guardar cambios" : "Crear documento"}
            </Button>
          </div>
        }
      >
        <PolicyForm
          initial={editingPolicy}
          onSubmit={handleFormSubmit}
          isPending={isPending}
          error={formError}
        />
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policy Row
// ---------------------------------------------------------------------------

interface PolicyRowProps {
  policy: Policy;
  isPending: boolean;
  deletingId: string | null;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDownload?: () => void;
}

function PolicyRow({
  policy: p,
  isPending,
  deletingId,
  onEdit,
  onPublish,
  onUnpublish,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onDownload,
}: PolicyRowProps) {
  const isDeleting = deletingId === p.id;

  return (
    <Card padding="none">
      <CardContent className="p-4">
        {isDeleting ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <IconAlertCircle className="w-4 h-4 text-destructive shrink-0" />
              ¿Eliminar{" "}
              <span className="font-medium">"{p.title}"</span>? Se borrará el archivo del storage.
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
            {/* Left: icon + title + meta */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <IconFileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{p.title}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {p.category}
                  </span>
                  <span className="text-xs text-muted-foreground">v{p.version}</span>
                  {p.fileName && (
                    <span className="text-xs text-muted-foreground">
                      {getMimeLabel(p.fileType)} · {formatBytes(p.fileSize)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {p.publishedAt
                      ? `Publicado ${formatDate(p.publishedAt)}`
                      : `Creado ${formatDate(p.createdAt)}`}
                  </span>
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                    {p.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right: status + actions */}
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={p.status} />

              {/* Publish / Unpublish */}
              {p.status === "draft" && (
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
              {p.status === "published" && (
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={isPending}
                  onClick={onUnpublish}
                >
                  Despublicar
                </Button>
              )}

              {/* Download */}
              {onDownload && (
                <button
                  onClick={onDownload}
                  title="Descargar"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <IconDownload className="w-4 h-4" />
                </button>
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
