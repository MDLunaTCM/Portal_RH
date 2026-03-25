"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Avatar, Progress, Skeleton, EmptyState } from "@/components/ui";
import {
  IconCalendar,
  IconWallet,
  IconDocument,
  IconGraduationCap,
  IconMegaphone,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconArrowRight,
  IconCheck,
  IconAlertCircle,
  IconUsers,
  IconBriefcase,
  IconTarget,
  IconInbox,
  IconChartBar,
} from "@/components/icons";

// Stats Card Widget
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: { value: number; label: string };
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href?: string;
}

export function StatsCard({ title, value, change, icon: Icon, href }: StatsCardProps) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${change.value >= 0 ? "text-success-foreground" : "text-error-foreground"}`}>
                {change.value >= 0 ? <IconTrendingUp className="w-3 h-3" /> : <IconTrendingDown className="w-3 h-3" />}
                <span>{change.value >= 0 ? "+" : ""}{change.value}% {change.label}</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Quick Actions Widget
interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Pending Requests Widget
interface Request {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  description: string;
}

interface PendingRequestsProps {
  requests: Request[];
  showViewAll?: boolean;
}

const statusVariants = {
  pending: "warning",
  approved: "success",
  rejected: "error",
} as const;

export function PendingRequests({ requests, showViewAll = true }: PendingRequestsProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Your recent request status</CardDescription>
        </div>
        {showViewAll && (
          <Link href="/requests/vacations" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <IconArrowRight className="w-4 h-4" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <EmptyState
            icon={<IconInbox className="w-12 h-12" />}
            title="No pending requests"
            description="You don&apos;t have any pending requests at the moment."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <IconDocument className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{request.type}</p>
                    <p className="text-xs text-muted-foreground">{request.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{request.date}</span>
                  <Badge variant={statusVariants[request.status]}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Vacation Balance Widget
interface VacationBalanceProps {
  used: number;
  total: number;
  pending: number;
}

export function VacationBalance({ used, total, pending }: VacationBalanceProps) {
  const remaining = total - used - pending;
  const usedPercentage = (used / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCalendar className="w-5 h-5 text-primary" />
          Vacation Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{remaining}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning-foreground">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success-foreground">{used}</p>
            <p className="text-xs text-muted-foreground">Used</p>
          </div>
        </div>
        <Progress value={usedPercentage} showLabel />
        <p className="text-xs text-muted-foreground text-center">
          {used} of {total} days used this year
        </p>
        <Link href="/requests/vacations">
          <button className="w-full py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
            Request Vacation
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Announcements Widget
interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  priority: "normal" | "important" | "urgent";
}

interface AnnouncementsProps {
  announcements: Announcement[];
}

const priorityStyles = {
  normal: "",
  important: "border-l-4 border-l-warning-foreground",
  urgent: "border-l-4 border-l-error-foreground",
};

export function Announcements({ announcements }: AnnouncementsProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <IconMegaphone className="w-5 h-5 text-primary" />
            Announcements
          </CardTitle>
        </div>
        <Link href="/announcements" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <IconArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <EmptyState
            icon={<IconMegaphone className="w-12 h-12" />}
            title="No announcements"
            description="Check back later for company updates."
          />
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer ${priorityStyles[announcement.priority]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium">{announcement.title}</h4>
                  {announcement.priority !== "normal" && (
                    <Badge variant={announcement.priority === "urgent" ? "error" : "warning"}>
                      {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcement.excerpt}</p>
                <p className="text-xs text-muted-foreground mt-2">{announcement.date}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Training Progress Widget
interface Training {
  id: string;
  title: string;
  progress: number;
  dueDate: string;
  isRequired: boolean;
}

interface TrainingProgressProps {
  trainings: Training[];
}

export function TrainingProgress({ trainings }: TrainingProgressProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <IconGraduationCap className="w-5 h-5 text-primary" />
            My Training
          </CardTitle>
        </div>
        <Link href="/training/courses" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <IconArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {trainings.length === 0 ? (
          <EmptyState
            icon={<IconGraduationCap className="w-12 h-12" />}
            title="No active trainings"
            description="You&apos;ve completed all your assigned trainings."
          />
        ) : (
          <div className="space-y-4">
            {trainings.map((training) => (
              <div key={training.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{training.title}</span>
                    {training.isRequired && <Badge variant="error">Required</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">Due: {training.dueDate}</span>
                </div>
                <Progress value={training.progress} showLabel />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Team Alerts Widget (for Managers)
interface TeamAlert {
  id: string;
  type: "vacation" | "review" | "training" | "document";
  employee: { name: string; avatar?: string };
  message: string;
  date: string;
}

interface TeamAlertsProps {
  alerts: TeamAlert[];
}

export function TeamAlerts({ alerts }: TeamAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconAlertCircle className="w-5 h-5 text-primary" />
          Team Alerts
        </CardTitle>
        <CardDescription>Items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <EmptyState
            icon={<IconCheck className="w-12 h-12" />}
            title="All caught up"
            description="No pending items requiring your attention."
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Avatar fallback={alert.employee.name} size="sm" src={alert.employee.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.employee.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{alert.date}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// HR Operations Widget
interface HRStats {
  openPositions: number;
  pendingApprovals: number;
  newHires: number;
  exitingEmployees: number;
}

interface HROperationsProps {
  stats: HRStats;
}

export function HROperations({ stats }: HROperationsProps) {
  const items = [
    { label: "Open Positions", value: stats.openPositions, icon: IconBriefcase, href: "/recruitment/positions" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: IconDocument, href: "/requests/vacations" },
    { label: "New Hires (30d)", value: stats.newHires, icon: IconUsers, href: "/organization/directory" },
    { label: "Exiting (30d)", value: stats.exitingEmployees, icon: IconUsers, href: "/organization/directory" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconChartBar className="w-5 h-5 text-primary" />
          HR Operations
        </CardTitle>
        <CardDescription>Current operational metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Payroll Widget
export function PayrollWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWallet className="w-5 h-5 text-primary" />
          Latest Payroll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">December 2025</span>
            <Badge variant="success">Paid</Badge>
          </div>
          <p className="text-2xl font-bold">$4,250.00</p>
          <p className="text-xs text-muted-foreground mt-1">Deposited on Dec 15, 2025</p>
        </div>
        <Link href="/payroll/receipts">
          <button className="w-full py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
            View Receipts
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton for Dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
