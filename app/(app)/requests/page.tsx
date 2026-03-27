"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Tabs,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import {
  IconPlus,
  IconCheck,
  IconClock,
  IconClose,
  IconAlertCircle,
  IconInbox,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import {
  useMyRequestsList,
  type RequestListItem,
} from "@/modules/requests/hooks/use-my-requests-list";
import { getRequestTypeMeta } from "@/modules/requests/catalog";

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const statusConfig = {
  pending: { variant: "warning" as const, icon: IconClock, label: "Pendiente" },
  approved: { variant: "success" as const, icon: IconCheck, label: "Aprobada" },
  rejected: { variant: "error" as const, icon: IconClose, label: "Rechazada" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
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
            No pudimos cargar tus solicitudes. Verifica tu conexión e intenta de nuevo.
          </p>
          <Button onClick={onRetry}>Intentar de nuevo</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestCard({ request, onView }: { request: RequestListItem; onView: (requestId: string) => void }) {
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  const meta = getRequestTypeMeta(request.typeCode);
  const Icon = meta?.icon ?? IconInbox;
  const iconBg = meta?.iconBg ?? "bg-muted";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{request.type}</h3>
                <Badge variant={status.variant}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enviada el {request.date}
              </p>
              {request.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                  &quot;{request.description}&quot;
                </p>
              )}
            </div>
          </div>
          <div className="self-end sm:self-center">
            <Button variant="outline" size="sm" onClick={() => onView(request.id)}>
              Ver detalle
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

export default function RequestsPage() {
  const router = useRouter();
  const { user, isLoading: sessionLoading } = useSession();
  const userId = user?.id ?? null;

  const { requests, isLoading, error, refetch } = useMyRequestsList(userId);
  const [activeTab, setActiveTab] = useState<FilterStatus>("all");

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

  const handleTabChange = (id: string) => {
    if (id === "all" || id === "pending" || id === "approved" || id === "rejected") {
      setActiveTab(id);
    }
  };

  const filteredRequests =
    activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  const emptyMessages: Record<FilterStatus, { title: string; description: string }> = {
    all: {
      title: "No tienes solicitudes",
      description: "Crea tu primera solicitud usando el botón de arriba.",
    },
    pending: {
      title: "Sin solicitudes pendientes",
      description: "No tienes solicitudes en espera de revisión.",
    },
    approved: {
      title: "Sin solicitudes aprobadas",
      description: "Tus solicitudes aprobadas aparecerán aquí.",
    },
    rejected: {
      title: "Sin solicitudes rechazadas",
      description: "Tus solicitudes rechazadas aparecerán aquí.",
    },
  };

  const showLoading = sessionLoading || isLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Solicitudes</h1>
          <p className="text-muted-foreground">
            Historial y estado de tus solicitudes al área de RH
          </p>
        </div>
        <Button leftIcon={<IconPlus className="w-4 h-4" />} onClick={() => router.push("/requests/new")}>
          Nueva solicitud
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      {/* Content */}
      {showLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<IconInbox className="w-12 h-12" />}
              title={emptyMessages[activeTab].title}
              description={emptyMessages[activeTab].description}
              action={
                activeTab === "all" ? (
                  <Button onClick={() => router.push("/requests/new")}>
                    Nueva solicitud
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} onView={(requestId) => router.push(`/requests/${requestId}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
