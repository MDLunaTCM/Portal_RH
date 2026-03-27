"use client";

import { useState, useEffect, useCallback } from "react";
import { getHRDashboardData } from "@/modules/hr/actions";
import type { HRDashboardMetrics } from "@/modules/hr/types";

// ---------------------------------------------------------------------------
// Team alert shape — used by the TeamAlerts widget
// ---------------------------------------------------------------------------

export interface HRTeamAlert {
  id: string;
  type: "document" | "vacation" | "review" | "training";
  employee: { name: string; avatar?: string };
  message: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  ine: "INE / IFE",
  curp: "CURP",
  rfc: "Constancia de RFC",
  nss: "NSS (IMSS)",
  birth_certificate: "Acta de Nacimiento",
  address_proof: "Comprobante de Domicilio",
  degree: "Título / Certificado",
  contract: "Contrato Laboral",
  other: "Documento",
};

/**
 * Fetches aggregate HR dashboard metrics and recent team alerts.
 * Delegates to the `getHRDashboardData` server action to avoid
 * browser-client session timing issues.
 */
export function useHRDashboard() {
  const [metrics, setMetrics] = useState<HRDashboardMetrics>({
    total_employees: 0,
    active_employees: 0,
    pending_requests: 0,
    pending_documents: 0,
    active_announcements: 0,
    open_positions: 0,
  });
  const [newHires30d, setNewHires30d] = useState(0);
  const [teamAlerts, setTeamAlerts] = useState<HRTeamAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const result = await getHRDashboardData();

        if (cancelled) return;

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        setMetrics(result.metrics);
        setNewHires30d(result.newHires30d);

        const alerts: HRTeamAlert[] = result.teamAlerts.map((row) => {
          const name = row.profile
            ? `${row.profile.first_name} ${row.profile.last_name}`
            : "Colaborador";

          const docLabel = CATEGORY_LABELS[row.category ?? ""] ?? "Documento";

          return {
            id: row.id,
            type: "document" as const,
            employee: {
              name,
              avatar: row.profile?.avatar_url ?? undefined,
            },
            message: `${docLabel} en revisión`,
            date: new Date(row.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
            }),
          };
        });

        setTeamAlerts(alerts);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar métricas");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return { metrics, newHires30d, teamAlerts, isLoading, error, refetch };
}
