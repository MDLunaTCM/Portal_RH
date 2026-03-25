"use client";

import { useState } from "react";
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
import { Tabs } from "@/components/ui";

type UserRole = "employee" | "hr" | "manager" | "admin";

// Mock data
const mockRequests = [
  { id: "1", type: "Vacation Request", status: "pending" as const, date: "Dec 18, 2025", description: "Dec 20-27, 2025 (5 days)" },
  { id: "2", type: "Employment Letter", status: "approved" as const, date: "Dec 15, 2025", description: "Visa application purpose" },
  { id: "3", type: "Equipment Request", status: "pending" as const, date: "Dec 10, 2025", description: "External monitor" },
];

const mockAnnouncements = [
  { id: "1", title: "Holiday Office Hours", excerpt: "Please note our modified office hours during the holiday season. The office will be closed from December 24-26.", date: "Today", priority: "important" as const },
  { id: "2", title: "Annual Performance Review Cycle", excerpt: "The annual performance review cycle begins January 15. Please prepare your self-assessment.", date: "2 days ago", priority: "urgent" as const },
  { id: "3", title: "New Parking Policy", excerpt: "Starting January 1, we will implement a new parking allocation system. Please read the full policy.", date: "1 week ago", priority: "normal" as const },
];

const mockTrainings = [
  { id: "1", title: "Information Security 2025", progress: 75, dueDate: "Dec 31, 2025", isRequired: true },
  { id: "2", title: "Anti-Harassment Training", progress: 100, dueDate: "Jan 15, 2026", isRequired: true },
  { id: "3", title: "Leadership Fundamentals", progress: 30, dueDate: "Feb 28, 2026", isRequired: false },
];

const mockTeamAlerts = [
  { id: "1", type: "vacation" as const, employee: { name: "Carlos Rodriguez" }, message: "Vacation request: Dec 23-27", date: "Today" },
  { id: "2", type: "review" as const, employee: { name: "Ana Martinez" }, message: "Performance review due in 5 days", date: "Yesterday" },
  { id: "3", type: "training" as const, employee: { name: "Luis Hernandez" }, message: "Overdue compliance training", date: "2 days ago" },
];

const employeeQuickActions = [
  { label: "Request Vacation", href: "/requests/vacations", icon: IconCalendar },
  { label: "View Payroll", href: "/payroll/receipts", icon: IconWallet },
  { label: "Request Letter", href: "/requests/letters", icon: IconDocument },
  { label: "My Training", href: "/training/courses", icon: IconGraduationCap },
  { label: "Time Clock", href: "/attendance", icon: IconClock },
  { label: "Directory", href: "/organization/directory", icon: IconUsers },
  { label: "Parking Card", href: "/access/parking", icon: IconCar },
  { label: "My Documents", href: "/documents/personal", icon: IconFileText },
];

const hrQuickActions = [
  { label: "Pending Approvals", href: "/requests/vacations", icon: IconDocument },
  { label: "Open Positions", href: "/recruitment/positions", icon: IconBriefcase },
  { label: "Candidates", href: "/recruitment/candidates", icon: IconUsers },
  { label: "Announcements", href: "/announcements", icon: IconMessageSquare },
  { label: "Reports", href: "/reports/analytics", icon: IconTarget },
  { label: "Org Chart", href: "/organization/chart", icon: IconUsers },
  { label: "Payroll Mgmt", href: "/payroll/management", icon: IconWallet },
  { label: "Badges", href: "/access/badges", icon: IconIdCard },
];

const managerQuickActions = [
  { label: "Team Requests", href: "/requests/vacations", icon: IconDocument },
  { label: "Team Reviews", href: "/performance/team", icon: IconTarget },
  { label: "My Team", href: "/organization/directory", icon: IconUsers },
  { label: "Requisitions", href: "/recruitment/requisitions", icon: IconBriefcase },
  { label: "Time Clock", href: "/attendance", icon: IconClock },
  { label: "Team Reports", href: "/reports/team", icon: IconTarget },
  { label: "Request Vacation", href: "/requests/vacations", icon: IconCalendar },
  { label: "View Payroll", href: "/payroll/receipts", icon: IconWallet },
];

// Dashboard content by role
function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Vacation Days Left" value="12" icon={IconCalendar} href="/requests/vacations" />
        <StatsCard title="Pending Requests" value="2" icon={IconDocument} href="/requests/vacations" />
        <StatsCard title="Trainings Due" value="1" icon={IconGraduationCap} href="/training/courses" />
        <StatsCard title="Next Payday" value="Dec 31" icon={IconWallet} href="/payroll/receipts" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={employeeQuickActions} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PendingRequests requests={mockRequests} />
          <Announcements announcements={mockAnnouncements} />
        </div>
        <div className="space-y-6">
          <VacationBalance used={8} total={20} pending={2} />
          <PayrollWidget />
          <TrainingProgress trainings={mockTrainings} />
        </div>
      </div>
    </div>
  );
}

function HRDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Employees" value="487" change={{ value: 3.2, label: "this month" }} icon={IconUsers} />
        <StatsCard title="Open Positions" value="12" icon={IconBriefcase} href="/recruitment/positions" />
        <StatsCard title="Pending Approvals" value="23" icon={IconDocument} href="/requests/vacations" />
        <StatsCard title="Active Trainings" value="156" icon={IconGraduationCap} href="/training/admin" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={hrQuickActions} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <HROperations stats={{ openPositions: 12, pendingApprovals: 23, newHires: 8, exitingEmployees: 2 }} />
          <PendingRequests requests={mockRequests} />
        </div>
        <div className="space-y-6">
          <Announcements announcements={mockAnnouncements} />
          <TeamAlerts alerts={mockTeamAlerts} />
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Team Members" value="14" icon={IconUsers} href="/organization/directory" />
        <StatsCard title="Pending Approvals" value="5" icon={IconDocument} href="/requests/vacations" />
        <StatsCard title="Open Requisitions" value="2" icon={IconBriefcase} href="/recruitment/requisitions" />
        <StatsCard title="Reviews Due" value="3" icon={IconTarget} href="/performance/team" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={managerQuickActions} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TeamAlerts alerts={mockTeamAlerts} />
          <PendingRequests requests={mockRequests} />
        </div>
        <div className="space-y-6">
          <VacationBalance used={10} total={20} pending={0} />
          <Announcements announcements={mockAnnouncements} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // In a real app, this would come from auth context
  const [activeRole, setActiveRole] = useState<UserRole>("employee");

  const roleTabs = [
    { id: "employee", label: "Employee View" },
    { id: "hr", label: "HR View" },
    { id: "manager", label: "Manager View" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Maria. Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Demo role switcher - remove in production */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground mb-2">Demo: Switch dashboard view by role</p>
        <Tabs tabs={roleTabs} activeTab={activeRole} onChange={(id) => setActiveRole(id as UserRole)} />
      </div>

      {/* Role-specific dashboard */}
      {activeRole === "employee" && <EmployeeDashboard />}
      {activeRole === "hr" && <HRDashboard />}
      {activeRole === "manager" && <ManagerDashboard />}
    </div>
  );
}
