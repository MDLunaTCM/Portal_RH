"use client";

import {
  StatsCard,
  QuickActions,
  PendingRequests,
  VacationBalance,
  Announcements,
  TrainingProgress,
  TeamAlerts,
  HROperations,
  PayrollWidget,
  DashboardSkeleton,
  AnnouncementsSkeleton,
} from "@/components/dashboard/widgets";
import {
  IconCalendar,
  IconWallet,
  IconDocument,
  IconGraduationCap,
  IconClock,
  IconUsers,
  IconTarget,
  IconBriefcase,
  IconCar,
  IconIdCard,
  IconMessageSquare,
  IconFileText,
} from "@/components/icons";
import { useSession } from "@/modules/auth/context";
import { useAnnouncements } from "@/modules/announcements/hooks/use-announcements";
import { useMyRequests } from "@/modules/requests/hooks/use-my-requests";
import { useHRDashboard } from "@/modules/hr/hooks/use-hr-dashboard";
import { useHRPendingRequests } from "@/modules/hr/hooks/use-hr-pending-requests";

// ---------------------------------------------------------------------------
// Quick-action sets per role (static — no Supabase needed)
// ---------------------------------------------------------------------------

const employeeQuickActions = [
  { label: "Pedir Vacaciones", href: "/requests/vacations", icon: IconCalendar },
  { label: "Ver Nómina", href: "/payroll/receipts", icon: IconWallet },
  { label: "Carta Laboral", href: "/requests/letters", icon: IconDocument },
  { label: "Mi Capacitación", href: "/training/courses", icon: IconGraduationCap },
  { label: "Asistencia", href: "/attendance", icon: IconClock },
  { label: "Directorio", href: "/organization/directory", icon: IconUsers },
  { label: "Tarjeta Acceso", href: "/access/parking", icon: IconCar },
  { label: "Mis Documentos", href: "/documents/personal", icon: IconFileText },
];

const hrQuickActions = [
  { label: "Solicitudes", href: "/hr/requests", icon: IconDocument },
  { label: "Vacantes", href: "/recruitment/positions", icon: IconBriefcase },
  { label: "Candidatos", href: "/recruitment/candidates", icon: IconUsers },
  { label: "Anuncios", href: "/announcements", icon: IconMessageSquare },
  { label: "Reportes", href: "/reports/analytics", icon: IconTarget },
  { label: "Directorio", href: "/organization/directory", icon: IconUsers },
  { label: "Nómina", href: "/payroll/management", icon: IconWallet },
  { label: "Expedientes", href: "/documents/management", icon: IconIdCard },
];

const managerQuickActions = [
  { label: "Solicitudes Equipo", href: "/requests/vacations", icon: IconDocument },
  { label: "Evaluaciones", href: "/performance/team", icon: IconTarget },
  { label: "Mi Equipo", href: "/organization/directory", icon: IconUsers },
  { label: "Requisiciones", href: "/recruitment/requisitions", icon: IconBriefcase },
  { label: "Asistencia", href: "/attendance", icon: IconClock },
  { label: "Reportes", href: "/reports/team", icon: IconTarget },
  { label: "Mis Vacaciones", href: "/requests/vacations", icon: IconCalendar },
  { label: "Ver Nómina", href: "/payroll/receipts", icon: IconWallet },
];

// ---------------------------------------------------------------------------
// Role-specific dashboard views
// (Widgets are V0 components — kept intact; only data source changed)
// ---------------------------------------------------------------------------

interface EmployeeDashboardProps {
  name: string;
  userId: string;
}

function EmployeeDashboard({ userId }: EmployeeDashboardProps) {
  const { requests, isLoading: reqLoading } = useMyRequests(userId, 5);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // Placeholder stats — connected to real data in dedicated tasks
  // (vacation balance → TASK-011, payroll date → payroll module)
  const stats = [
    { title: "Días de Vacaciones", value: "—", icon: IconCalendar, href: "/requests/vacations" },
    {
      title: "Solicitudes Pendientes",
      value: reqLoading ? "—" : String(pendingCount),
      icon: IconDocument,
      href: "/requests/vacations",
    },
    { title: "Capacitaciones", value: "—", icon: IconGraduationCap, href: "/training/courses" },
    { title: "Próximo Pago", value: "—", icon: IconWallet, href: "/payroll/receipts" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} href={s.href} />
        ))}
      </div>

      <QuickActions actions={employeeQuickActions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PendingRequests requests={requests} />
        </div>
        <div className="space-y-6">
          <VacationBalance used={0} total={0} pending={0} />
          <PayrollWidget />
          <TrainingProgress trainings={[]} />
        </div>
      </div>
    </div>
  );
}

interface HRDashboardProps {
  userId: string;
}

function HRDashboard(_props: HRDashboardProps) {
  const { metrics, newHires30d, teamAlerts, isLoading: metricsLoading } = useHRDashboard();
  const { requests, isLoading: reqLoading } = useHRPendingRequests(8);

  const isLoading = metricsLoading || reqLoading;

  const stats = [
    {
      title: "Colaboradores Activos",
      value: isLoading ? "—" : String(metrics.active_employees),
      icon: IconUsers,
      href: "/organization/directory",
    },
    {
      title: "Solicitudes Pendientes",
      value: isLoading ? "—" : String(metrics.pending_requests),
      icon: IconDocument,
      href: "/requests",
      ...(metrics.pending_requests > 0 && !isLoading
        ? { change: { value: metrics.pending_requests, label: "por revisar" } }
        : {}),
    },
    {
      title: "Documentos en Revisión",
      value: isLoading ? "—" : String(metrics.pending_documents),
      icon: IconGraduationCap,
      href: "/documents/management",
    },
    {
      title: "Ingresos (30 días)",
      value: isLoading ? "—" : String(newHires30d),
      icon: IconBriefcase,
      href: "/organization/directory",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatsCard
            key={s.title}
            title={s.title}
            value={s.value}
            icon={s.icon}
            href={s.href}
            change={s.change}
          />
        ))}
      </div>

      <QuickActions actions={hrQuickActions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <HROperations
            stats={{
              openPositions: metrics.open_positions,
              pendingApprovals: metrics.pending_requests,
              newHires: newHires30d,
              exitingEmployees: 0, // no offboarding table in MVP
            }}
          />
          <PendingRequests requests={requests} />
        </div>
        <div className="space-y-6">
          <TeamAlerts alerts={teamAlerts} />
        </div>
      </div>
    </div>
  );
}

interface ManagerDashboardProps {
  userId: string;
}

function ManagerDashboard({ userId }: ManagerDashboardProps) {
  const { requests, isLoading: reqLoading } = useMyRequests(userId, 5);
  const { metrics, isLoading: metricsLoading } = useHRDashboard();

  const isLoading = reqLoading || metricsLoading;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const stats = [
    {
      title: "Miembros del Equipo",
      value: isLoading ? "—" : String(metrics.active_employees),
      icon: IconUsers,
      href: "/organization/directory",
    },
    {
      title: "Solicitudes Pendientes",
      value: isLoading ? "—" : String(metrics.pending_requests || pendingCount),
      icon: IconDocument,
      href: "/requests/vacations",
    },
    { title: "Requisiciones Abiertas", value: "—", icon: IconBriefcase, href: "/recruitment/requisitions" },
    { title: "Evaluaciones Pendientes", value: "—", icon: IconTarget, href: "/performance/team" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} href={s.href} />
        ))}
      </div>

      <QuickActions actions={managerQuickActions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TeamAlerts alerts={[]} />
          <PendingRequests requests={requests} />
        </div>
        <div className="space-y-6">
          <VacationBalance used={0} total={0} pending={0} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user, profile, isLoading } = useSession();

  // Announcements are shared across all roles; load them at page level
  const { announcements, isLoading: annLoading } = useAnnouncements(
    profile?.role ?? null,
    3,
  );

  if (isLoading) return <DashboardSkeleton />;

  const firstName = profile ? profile.first_name : (user?.email ?? "");
  const role = profile?.role ?? "employee";
  const userId = user?.id ?? null;

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground capitalize">
            Bienvenido/a de vuelta, {firstName}.
          </p>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Role-specific content */}
      {role === "employee" && userId && (
        <EmployeeDashboard name={firstName} userId={userId} />
      )}
      {role === "manager" && userId && (
        <ManagerDashboard userId={userId} />
      )}
      {(role === "hr_admin" || role === "super_admin") && userId && (
        <HRDashboard userId={userId} />
      )}

      {/* Announcements — visible to all roles, always shown at bottom */}
      {annLoading ? (
        <AnnouncementsSkeleton />
      ) : (
        <Announcements announcements={announcements} />
      )}
    </div>
  );
}
