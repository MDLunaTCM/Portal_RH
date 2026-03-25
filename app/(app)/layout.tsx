"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

// Mock user data - in a real app, this would come from auth context
const mockUser = {
  name: "Maria Garcia",
  email: "maria.garcia@company.com",
  role: "Employee",
  avatar: undefined,
};

type UserRole = "employee" | "hr" | "manager" | "admin";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Demo: change this to "hr", "manager", or "admin" to see different navigation
  const [userRole] = useState<UserRole>("employee");

  useEffect(() => {
    // Check system preference and stored preference
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={{ ...mockUser, role: userRole.charAt(0).toUpperCase() + userRole.slice(1) }}
          onMenuClick={() => setSidebarOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
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
