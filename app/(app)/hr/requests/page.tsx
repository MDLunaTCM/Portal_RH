"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Tabs,
  Input,
  EmptyState,
  Skeleton,
  Avatar,
} from "@/components/ui";
import {
  IconCheck,
  IconClock,
  IconClose,
  IconAlertCircle,
  IconInbox,
  IconSearch,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useHRRequestsList,
  type HRRequestListItem,
  type HRRequestFilters,
} from "@/modules/hr/hooks/use-hr-requests-list";
import { getRequestTypeMeta, REQUEST_TYPE_CATALOG } from "@/modules/requests/catalog";

// ---------------------------------------------------------------------------
// Status config (mirrors /requests/page.tsx)
// ---------------------------------------------------------------------------

type TabStatus = "all" | "pending" | "approved" | "rejected";

const statusConfig = {
  pending: { variant: "warning" as const, icon: IconClock, label: "Pendiente" },
  approved: { variant: "success" as const, icon: IconCheck, label: "Aprobada" },
  rejected: { variant: "error" as const, icon: IconClose, label: "Rechazada" },
};

// ---------------------------------------------------------------------------
// Request type dropdown options
// ---------------------------------------------------------------------------

const REQUEST_TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  ...Object.entries(REQUEST_TYPE_CATALOG).map(([code, meta]) => ({
    value: code,
    label: meta.code
      .split("_")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  })),
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-error-border bg-error/30">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mb-4">
            <IconAlertCircle className="w-8 h-8 text-error-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error al cargar solicitudes
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            No pudimos cargar las solicitudes. Verifica tu conexión e intenta de nuevo.
          </p>
          <Button onClick={onRetry}>Intentar de nuevo</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HRRequestRow({ request }: { request: HRRequestListItem }) {
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  const meta = getRequestTypeMeta(request.typeCode);
  const TypeIcon = meta?.icon ?? IconInbox;
  const iconBg = meta?.iconBg ?? "bg-muted";

  const initials = request.employee.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Employee + request type */}
          <div className="flex items-start gap-4 min-w-0">
            <Avatar
              src={request.employee.avatar_url ?? undefined}
              alt={request.employee.name}
              fallback={initials}
              size="md"
            />
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">{request.employee.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <div
                  className={`w-5 h-5 rounded ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <TypeIcon className="w-3 h-3" />
                </div>
                <span className="text-sm text-muted-foreground">{request.type}</span>
              </div>
              {request.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                  &quot;{request.description}&quot;
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Enviada el {request.date}
              </p>
            </div>
          </div>

          {/* Status badge + action */}
          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <Badge variant={status.variant}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
            <Button variant="outline" size="sm">
              <Link href={`/requests/${request.id}`}>Ver detalle</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HRRequestsPage() {
  const { profile, isLoading: sessionLoading } = useSession();
  const router = useRouter();

  // Tab state — drives client-side status filter only
  const [activeTab, setActiveTab] = useState<TabStatus>("all");

  // Filter bar state
  const [search, setSearch] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Always fetch without server-side status filter so counts stay accurate
  const filters: HRRequestFilters = {
    status: "",
    date_from: dateFrom,
    date_to: dateTo,
    typeCode,
    search,
  };

  const { requests, isLoading, error, refetch } = useHRRequestsList(filters);

  // Counts over the full filtered set
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const tabs = [
    { id: "all", label: "Todas", count: counts.all },
    { id: "pending", label: "Pendientes", count: counts.pending },
    { id: "approved", label: "Aprobadas", count: counts.approved },
    { id: "rejected", label: "Rechazadas", count: counts.rejected },
  ];

  // Client-side tab filter
  const visibleRequests =
    activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  // Role guard — redirect non-HR users
  const role = profile?.role;
  if (!sessionLoading && profile && role !== "hr_admin" && role !== "super_admin") {
    router.replace("/dashboard");
    return null;
  }

  const showLoading = sessionLoading || isLoading;

  const emptyMessages: Record<TabStatus, { title: string; description: string }> = {
    all: {
      title: "No hay solicitudes",
      description: "No se encontraron solicitudes con los filtros actuales.",
    },
    pending: {
      title: "Sin solicitudes pendientes",
      description: "No hay solicitudes pendientes de revisión.",
    },
    approved: {
      title: "Sin solicitudes aprobadas",
      description: "No se encontraron solicitudes aprobadas.",
    },
    rejected: {
      title: "Sin solicitudes rechazadas",
      description: "No se encontraron solicitudes rechazadas.",
    },
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bandeja de Solicitudes</h1>
        <p className="text-muted-foreground">
          Revisa y gestiona todas las solicitudes de los colaboradores
        </p>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por colaborador o tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Request type */}
            <select
              value={typeCode}
              onChange={(e) => setTypeCode(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {REQUEST_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Date from */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Desde"
              className="h-10 rounded-lg border border-border bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Date to */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Hasta"
              className="h-10 rounded-lg border border-border bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Clear */}
            {(search || typeCode || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setTypeCode("");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabStatus)} />

      {/* Content */}
      {showLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : visibleRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<IconInbox className="w-12 h-12" />}
              title={emptyMessages[activeTab].title}
              description={emptyMessages[activeTab].description}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleRequests.map((request) => (
            <HRRequestRow key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
