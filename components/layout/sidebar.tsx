"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconCalendar,
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
  IconIdCard,
  IconMessageSquare,
  IconFileText,
  IconClock,
  IconInbox,
} from "@/components/icons";

type UserRole = "employee" | "hr" | "manager" | "admin";

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
    roles: ["employee", "hr", "manager", "admin"],
  },
  {
    label: "My Requests",
    icon: IconInbox,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "Vacations", href: "/requests/vacations", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Employment Letters", href: "/requests/letters", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Card Replacement", href: "/requests/cards", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Equipment", href: "/requests/equipment", roles: ["employee", "hr", "manager", "admin"] },
    ],
  },
  {
    label: "Payroll",
    icon: IconWallet,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "My Receipts", href: "/payroll/receipts", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Payroll Management", href: "/payroll/management", roles: ["hr", "admin"] },
    ],
  },
  {
    label: "Time & Attendance",
    href: "/attendance",
    icon: IconClock,
    roles: ["employee", "hr", "manager", "admin"],
  },
  {
    label: "Training",
    icon: IconGraduationCap,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "My Courses", href: "/training/courses", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Onboarding", href: "/training/onboarding", roles: ["employee", "hr", "manager", "admin"] },
      { label: "LMS Admin", href: "/training/admin", roles: ["hr", "admin"] },
    ],
  },
  {
    label: "Performance",
    icon: IconTarget,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "My Reviews", href: "/performance/reviews", roles: ["employee", "hr", "manager", "admin"] },
      { label: "My KPIs", href: "/performance/kpis", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Team Reviews", href: "/performance/team", roles: ["manager", "hr", "admin"] },
    ],
  },
  {
    label: "Organization",
    icon: IconUsers,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "Directory", href: "/organization/directory", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Org Chart", href: "/organization/chart", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Departments", href: "/organization/departments", roles: ["hr", "admin"] },
    ],
  },
  {
    label: "Recruitment",
    icon: IconBriefcase,
    roles: ["hr", "manager", "admin"],
    children: [
      { label: "Open Positions", href: "/recruitment/positions", roles: ["hr", "manager", "admin"] },
      { label: "Candidates", href: "/recruitment/candidates", roles: ["hr", "admin"] },
      { label: "Requisitions", href: "/recruitment/requisitions", roles: ["hr", "manager", "admin"] },
    ],
  },
  {
    label: "Documents",
    icon: IconDocument,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "My Documents", href: "/documents/personal", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Policies", href: "/documents/policies", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Document Management", href: "/documents/management", roles: ["hr", "admin"] },
    ],
  },
  {
    label: "Parking & Badges",
    icon: IconCar,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "Parking Cards", href: "/access/parking", roles: ["employee", "hr", "manager", "admin"] },
      { label: "ID Badges", href: "/access/badges", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Access Management", href: "/access/management", roles: ["hr", "admin"] },
    ],
  },
  {
    label: "Announcements",
    href: "/announcements",
    icon: IconMegaphone,
    roles: ["employee", "hr", "manager", "admin"],
  },
  {
    label: "Reports",
    icon: IconChartBar,
    roles: ["hr", "manager", "admin"],
    children: [
      { label: "Team Reports", href: "/reports/team", roles: ["manager", "hr", "admin"] },
      { label: "HR Analytics", href: "/reports/analytics", roles: ["hr", "admin"] },
      { label: "Headcount", href: "/reports/headcount", roles: ["hr", "admin"] },
    ],
  },
  {
    label: "Feedback",
    icon: IconMessageSquare,
    roles: ["employee", "hr", "manager", "admin"],
    children: [
      { label: "Suggestions", href: "/feedback/suggestions", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Recognition", href: "/feedback/recognition", roles: ["employee", "hr", "manager", "admin"] },
      { label: "Surveys", href: "/feedback/surveys", roles: ["hr", "admin"] },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: IconSettings,
    roles: ["employee", "hr", "manager", "admin"],
  },
  {
    label: "Help & Support",
    href: "/help",
    icon: IconHelpCircle,
    roles: ["employee", "hr", "manager", "admin"],
  },
];

interface SidebarProps {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["My Requests"]);

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-white">RH</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate">Portal RH</h1>
            <p className="text-xs text-sidebar-foreground/70 truncate">Human Resources</p>
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isItemActive(item)
                          ? "bg-sidebar-muted text-white"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-white"
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
                                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                  pathname === child.href
                                    ? "bg-sidebar-accent text-white"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-white"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-white"
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-white"
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
