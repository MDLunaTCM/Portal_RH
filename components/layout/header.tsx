"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, Badge } from "@/components/ui";
import {
  IconMenu,
  IconSearch,
  IconBell,
  IconSun,
  IconMoon,
  IconChevronDown,
  IconSettings,
  IconLogout,
  IconUsers,
} from "@/components/icons";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  onMenuClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => Promise<void>;
}

export function Header({ user, onMenuClick, isDarkMode, onToggleDarkMode, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    { id: 1, title: "Vacation request approved", description: "Your vacation request for Dec 20-27 has been approved", time: "5 min ago", unread: true },
    { id: 2, title: "New training available", description: "Complete your annual compliance training", time: "1 hour ago", unread: true },
    { id: 3, title: "Payroll processed", description: "Your December payroll has been processed", time: "2 days ago", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-primary/95 backdrop-blur-sm text-header-foreground flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 border-b border-primary/20">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <IconMenu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-xl px-3 py-2 min-w-[300px] transition-colors duration-200">
          <IconSearch className="w-4 h-4 text-white/70" />
          <input
            type="text"
            placeholder="Search employees, documents..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 w-full"
          />
          <kbd className="hidden lg:inline text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/50">
            /
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Mobile search button */}
        <button
          className="md:hidden p-2.5 hover:bg-white/10 rounded-xl transition-colors active:scale-95"
          aria-label="Search"
        >
          <IconSearch className="w-5 h-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95 text-white"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95 relative text-white"
            aria-label="Notifications"
          >
            <IconBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card text-card-foreground rounded-xl shadow-lg border border-border/50 overflow-hidden animate-slide-in">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <button className="text-xs text-primary hover:underline">Mark all as read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer ${
                      notification.unread ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notification.unread && (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <div className={notification.unread ? "" : "ml-5"}>
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-primary hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <Avatar fallback={user.name} size="sm" src={user.avatar} />
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-white/70">{user.role}</p>
            </div>
            <IconChevronDown className="hidden lg:block w-4 h-4 text-white/70" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card text-card-foreground rounded-xl shadow-lg border border-border/50 overflow-hidden animate-slide-in">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar fallback={user.name} size="lg" src={user.avatar} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <Badge variant="info" className="mt-1">{user.role}</Badge>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors active:scale-95"
                >
                  <IconUsers className="w-4 h-4" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors active:scale-95"
                >
                  <IconSettings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => onLogout()}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-sm transition-colors w-full text-destructive active:scale-95"
                >
                  <IconLogout className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
}
