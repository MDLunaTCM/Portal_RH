"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconWallet,
  IconDocument,
  IconUsers,
  IconBriefcase,
  IconGraduationCap,
  IconMegaphone,
  IconChartBar,
  IconTarget,
  IconSettings,
  IconHelpCircle,
  IconChevronDown,
  IconChevronRight,
  IconCar,
  IconMessageSquare,
  IconClock,
  IconInbox,
} from "@/components/icons";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: UserRole[];
  children?: { label: string; href: string; roles: UserRole[] }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: IconDashboard,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
  },
  {
    label: "Solicitudes",
    icon: IconInbox,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "Mis solicitudes", href: "/requests", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Nueva solicitud", href: "/requests/new", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Bandeja RH", href: "/hr/requests", roles: ["hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Payroll",
    icon: IconWallet,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "My Receipts", href: "/payroll/receipts", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Payroll Management", href: "/payroll/management", roles: ["hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Time & Attendance",
    href: "/attendance",
    icon: IconClock,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
  },
  {
    label: "Training",
    icon: IconGraduationCap,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "My Courses", href: "/training/courses", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Onboarding", href: "/training/onboarding", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "LMS Admin", href: "/training/admin", roles: ["hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Performance",
    icon: IconTarget,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "My Reviews", href: "/performance/reviews", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "My KPIs", href: "/performance/kpis", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Team Reviews", href: "/performance/team", roles: ["manager", "hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Organization",
    icon: IconUsers,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "Directory", href: "/organization/directory", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Org Chart", href: "/organization/chart", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Departments", href: "/organization/departments", roles: ["hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Recruitment",
    icon: IconBriefcase,
    roles: ["hr_admin", "manager", "super_admin"],
    children: [
      { label: "Open Positions", href: "/recruitment/positions", roles: ["hr_admin", "manager", "super_admin"] },
      { label: "Candidates", href: "/recruitment/candidates", roles: ["hr_admin", "super_admin"] },
      { label: "Requisitions", href: "/recruitment/requisitions", roles: ["hr_admin", "manager", "super_admin"] },
    ],
  },
  {
    label: "Documents",
    icon: IconDocument,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "My Documents", href: "/documents/personal", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Reglamentos", href: "/documents/policies", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Gestión de Reglamentos", href: "/documents/policies/management", roles: ["hr_admin", "super_admin"] },
      { label: "Document Management", href: "/documents/management", roles: ["hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Parking & Badges",
    icon: IconCar,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "Parking Cards", href: "/access/parking", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "ID Badges", href: "/access/badges", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Access Management", href: "/access/management", roles: ["hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Anuncios",
    icon: IconMegaphone,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "Tablón de anuncios", href: "/announcements", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Gestión de anuncios", href: "/announcements/management", roles: ["hr_admin", "super_admin"] },
    ],
  },
  {
    label: "Reports",
    icon: IconChartBar,
    roles: ["hr_admin", "manager", "super_admin"],
    children: [
      { label: "Team Reports", href: "/reports/team", roles: ["manager", "hr_admin", "super_admin"] },
      { label: "HR Analytics", href: "/reports/analytics", roles: ["hr_admin", "super_admin"] },
      { label: "Headcount", href: "/reports/headcount", roles: ["hr_admin", "super_admin"] },
      { label: "Bitácora de Auditoría", href: "/audit", roles: ["super_admin"] },
    ],
  },
  {
    label: "Feedback",
    icon: IconMessageSquare,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
    children: [
      { label: "Suggestions", href: "/feedback/suggestions", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Recognition", href: "/feedback/recognition", roles: ["employee", "hr_admin", "manager", "super_admin"] },
      { label: "Surveys", href: "/feedback/surveys", roles: ["hr_admin", "super_admin"] },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: IconSettings,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
  },
  {
    label: "Help & Support",
    href: "/help",
    icon: IconHelpCircle,
    roles: ["employee", "hr_admin", "manager", "super_admin"],
  },
];

interface SidebarProps {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Solicitudes"]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isItemActive = (item: NavItem) => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return false;
  };

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));
  const filteredBottomItems = bottomNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 dark:bg-black/50 z-40 lg:hidden bg-white"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar dark:bg-sidebar-dark text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center shrink-0 shadow-md">
            <span className="text-lg font-bold text-white">RH</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-black dark:text-white truncate">Portal RH</h1>
            <p className="text-xs text-black dark:text-white truncate">Human Resources</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                        isItemActive(item)
                          ? "bg-sidebar-accent/10 dark:bg-sidebar-accent/20 text-sidebar-accent dark:text-white font-semibold"
                          : "text-black dark:text-white hover:bg-sidebar-accent/5 dark:hover:bg-sidebar-accent/10"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {expandedItems.includes(item.label) ? (
                        <IconChevronDown className="w-4 h-4 shrink-0" />
                      ) : (
                        <IconChevronRight className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                    {expandedItems.includes(item.label) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        {item.children
                          .filter((child) => child.roles.includes(userRole))
                          .map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className={`block px-3 py-2 rounded-lg text-sm transition-all active:scale-95 ${
                                  pathname === child.href
                                    ? "bg-sidebar-accent/15 dark:bg-sidebar-accent/25 text-sidebar-accent dark:text-white font-medium"
                                    : "text-black dark:text-white hover:bg-sidebar-accent/5 dark:hover:bg-sidebar-accent/10"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                      pathname === item.href
                        ? "bg-sidebar-accent/10 dark:bg-sidebar-accent/20 text-sidebar-accent dark:text-white font-semibold"
                        : "text-black dark:text-white hover:bg-sidebar-accent/5 dark:hover:bg-sidebar-accent/10"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-white/10 p-3">
          <ul className="space-y-1">
            {filteredBottomItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href!}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    pathname === item.href
                      ? "bg-sidebar-accent/10 dark:bg-sidebar-accent/20 text-sidebar-accent dark:text-white font-semibold"
                      : "text-black dark:text-white hover:bg-sidebar-accent/5 dark:hover:bg-sidebar-accent/10"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
