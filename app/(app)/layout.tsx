"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useSession } from "@/modules/auth/context";
import { logout } from "@/modules/auth/actions";
import { getFullName, ROLE_LABELS } from "@/modules/auth/types";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored === "dark" || (!stored && systemDark);

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const sidebarRole = profile?.role ?? "employee";

  const headerUser = {
    name: profile ? getFullName(profile) : (user?.email ?? ""),
    email: user?.email ?? "",
    role: profile ? ROLE_LABELS[profile.role] : "Colaborador",
    avatar: profile?.avatar_url ?? undefined,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        userRole={sidebarRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={headerUser}
          onMenuClick={() => setSidebarOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
