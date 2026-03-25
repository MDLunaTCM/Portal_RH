"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight } from "@/components/icons";

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  requests: "My Requests",
  vacations: "Vacations",
  letters: "Employment Letters",
  cards: "Card Replacement",
  equipment: "Equipment",
  payroll: "Payroll",
  receipts: "My Receipts",
  management: "Management",
  attendance: "Time & Attendance",
  training: "Training",
  courses: "My Courses",
  onboarding: "Onboarding",
  admin: "Administration",
  performance: "Performance",
  reviews: "Reviews",
  kpis: "KPIs",
  team: "Team",
  organization: "Organization",
  directory: "Directory",
  chart: "Org Chart",
  departments: "Departments",
  recruitment: "Recruitment",
  positions: "Open Positions",
  candidates: "Candidates",
  requisitions: "Requisitions",
  documents: "Documents",
  personal: "Personal",
  policies: "Policies",
  access: "Access",
  parking: "Parking Cards",
  badges: "ID Badges",
  announcements: "Announcements",
  reports: "Reports",
  analytics: "Analytics",
  headcount: "Headcount",
  feedback: "Feedback",
  suggestions: "Suggestions",
  recognition: "Recognition",
  surveys: "Surveys",
  settings: "Settings",
  help: "Help & Support",
  profile: "Profile",
  notifications: "Notifications",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return null;
  }

  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Home
      </Link>
      {breadcrumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <IconChevronRight className="w-4 h-4 text-muted-foreground" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.path}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
