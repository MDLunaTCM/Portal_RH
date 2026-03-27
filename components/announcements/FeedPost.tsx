"use client";

import { Badge } from "@/components/ui";
import { IconCalendar, IconMegaphone } from "@/components/icons";
import { MediaGallery } from "./MediaGallery";
import type { BoardAnnouncement } from "@/modules/announcements/hooks/use-announcements-board";

interface FeedPostProps {
  announcement: BoardAnnouncement & {
    featured_image_url?: string;
    featured_image_alt?: string;
    media?: Array<{
      id: string;
      type: "image" | "video";
      url: string;
      alt?: string;
      thumbnail_url?: string;
    }>;
  };
  onClick: () => void;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, "año"],
    [2592000, "mes"],
    [604800, "semana"],
    [86400, "día"],
    [3600, "hora"],
    [60, "minuto"],
  ];

  for (const [secondsInInterval, name] of intervals) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return `hace ${interval} ${name}${interval > 1 ? "s" : ""}`;
    }
  }

  return "hace poco";
}

const PRIORITY_VARIANT: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  normal: "info",
  important: "warning",
  urgent: "error",
};

export function FeedPost({ announcement, onClick }: FeedPostProps) {
  const priorityVariant = PRIORITY_VARIANT[(announcement.priority as any) || "normal"] ?? "info";
  const timeAgo = formatTimeAgo(announcement.publishedAt);
  const hasMedia = announcement.featured_image_url || announcement.media?.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
    >
      {/* Header with category badge and timestamp */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {announcement.pinned && (
            <Badge variant="warning" className="flex items-center gap-1 shrink-0">
              <IconMegaphone className="w-3 h-3" />
              Fijado
            </Badge>
          )}
          <Badge variant={priorityVariant} className="shrink-0">
            {announcement.priority === "urgent"
              ? "Urgente"
              : announcement.priority === "important"
                ? "Importante"
                : "General"}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 space-y-2">
        <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
          {announcement.title}
        </h3>

        {/* Body - full content displayed */}
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {announcement.body}
        </p>
      </div>

      {/* Media Gallery - if present */}
      {hasMedia && (
        <div className="px-4 py-3">
          <MediaGallery
            featured_image={announcement.featured_image_url}
            featured_image_alt={announcement.featured_image_alt}
            media={announcement.media}
            variant="card"
          />
        </div>
      )}

      {/* Footer: Date and expiry indicator */}
      <div className="px-4 pb-4 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <IconCalendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{timeAgo}</span>
        </div>

        {announcement.expiresAt && (
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            ⏰ Vence: {formatDate(announcement.expiresAt)}
          </div>
        )}
      </div>
    </button>
  );
}
