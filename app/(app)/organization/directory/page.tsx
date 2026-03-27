"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import { Modal, Select, SearchInput } from "@/components/ui/shared";
import {
  IconUsers,
  IconMail,
  IconPhone,
  IconBuilding,
  IconBriefcase,
  IconAlertCircle,
  IconCalendar,
} from "@/components/icons";
import {
  useDirectory,
  type DirectoryProfile,
} from "@/modules/directory/hooks/use-directory";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Deterministic pastel bg per initials (avoids random color on re-render)
const AVATAR_COLORS = [
  "bg-primary/20 text-primary",
  "bg-info/20 text-info-foreground",
  "bg-success/20 text-success-foreground",
  "bg-warning/20 text-warning-foreground",
  "bg-secondary/20 text-secondary-foreground",
] as const;

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DirectorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-error-border bg-error/30">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mb-4">
            <IconAlertCircle className="w-8 h-8 text-error-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error al cargar el directorio
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            No pudimos cargar la lista de colaboradores. Verifica tu conexión e intenta de nuevo.
          </p>
          <Button onClick={onRetry}>Intentar de nuevo</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Employee card
// ---------------------------------------------------------------------------

function EmployeeCard({
  profile,
  onClick,
}: {
  profile: DirectoryProfile;
  onClick: () => void;
}) {
  const initials = getInitials(profile.firstName, profile.lastName);
  const colorClass = avatarColor(profile.fullName);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${colorClass}`}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{profile.fullName}</p>
            {profile.positionName && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {profile.positionName}
              </p>
            )}
            {profile.departmentName && (
              <Badge variant="outline" className="mt-1.5 text-xs">
                {profile.departmentName}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 truncate">
              <IconMail className="w-3 h-3 shrink-0" />
              {profile.email}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Employee detail modal
// ---------------------------------------------------------------------------

function EmployeeDetail({ profile }: { profile: DirectoryProfile }) {
  const initials = getInitials(profile.firstName, profile.lastName);
  const colorClass = avatarColor(profile.fullName);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-lg font-bold ${colorClass}`}
        >
          {initials}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{profile.fullName}</h3>
          {profile.positionName && (
            <p className="text-sm text-muted-foreground">{profile.positionName}</p>
          )}
          {profile.departmentName && (
            <Badge variant="outline" className="mt-1">
              {profile.departmentName}
            </Badge>
          )}
        </div>
      </div>

      {/* Contact details */}
      <div className="divide-y divide-border">
        <div className="flex items-center gap-3 py-3 first:pt-0">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <IconMail className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Correo</p>
            <a
              href={`mailto:${profile.email}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {profile.email}
            </a>
          </div>
        </div>

        {profile.phone && (
          <div className="flex items-center gap-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <IconPhone className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <a
                href={`tel:${profile.phone}`}
                className="text-sm font-medium text-foreground hover:underline"
              >
                {profile.phone}
              </a>
            </div>
          </div>
        )}

        {profile.departmentName && (
          <div className="flex items-center gap-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <IconBuilding className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Área</p>
              <p className="text-sm font-medium text-foreground">{profile.departmentName}</p>
            </div>
          </div>
        )}

        {profile.positionName && (
          <div className="flex items-center gap-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <IconBriefcase className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Puesto</p>
              <p className="text-sm font-medium text-foreground">{profile.positionName}</p>
            </div>
          </div>
        )}

        {profile.hireDate && (
          <div className="flex items-center gap-3 py-3 last:pb-0">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <IconCalendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha de ingreso</p>
              <p className="text-sm font-medium text-foreground">{formatDate(profile.hireDate)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DirectoryPage() {
  const { profiles, isLoading, error, refetch } = useDirectory();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selected, setSelected] = useState<DirectoryProfile | null>(null);

  // Build department options from loaded data
  const departmentOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of profiles) {
      if (p.departmentId && p.departmentName && !seen.has(p.departmentId)) {
        seen.set(p.departmentId, p.departmentName);
      }
    }
    const sorted = [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    return [
      { value: "", label: "Todas las áreas" },
      ...sorted.map(([id, name]) => ({ value: id, label: name })),
    ];
  }, [profiles]);

  // Client-side filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return profiles.filter((p) => {
      const matchesSearch =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.positionName ?? "").toLowerCase().includes(q);
      const matchesDept = !departmentFilter || p.departmentId === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [profiles, search, departmentFilter]);

  if (isLoading) return <DirectorySkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Directorio</h1>
          <p className="text-muted-foreground">
            {profiles.length} colaborador{profiles.length !== 1 ? "es" : ""} activo
            {profiles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
          <IconUsers className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{filtered.length}</span>
          <span className="text-xs text-muted-foreground">
            {filtered.length !== profiles.length ? "de " + profiles.length : "total"}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, puesto o correo..."
          className="flex-1"
        />
        <Select
          options={departmentOptions}
          value={departmentFilter}
          onChange={setDepartmentFilter}
          className="w-full sm:w-52"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<IconUsers className="w-12 h-12" />}
              title={
                profiles.length === 0
                  ? "Sin colaboradores registrados"
                  : "Sin resultados"
              }
              description={
                profiles.length === 0
                  ? "El directorio aparecerá aquí cuando se registren colaboradores."
                  : "Ningún colaborador coincide con los filtros actuales."
              }
              action={
                (search || departmentFilter) ? (
                  <Button
                    variant="secondary"
                    onClick={() => { setSearch(""); setDepartmentFilter(""); }}
                  >
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile) => (
            <EmployeeCard
              key={profile.id}
              profile={profile}
              onClick={() => setSelected(profile)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Perfil del colaborador"
        size="sm"
      >
        {selected && <EmployeeDetail profile={selected} />}
      </Modal>
    </div>
  );
}
