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
    <div
      className="w-full bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer group"
      onClick={onClick}
    >
      {/* Header with badges and metadata */}
      <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {announcement.pinned && (
            <Badge variant="warning" className="flex items-center gap-1.5 shrink-0">
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
      <div className="px-5 pb-1">
        <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
          {announcement.title}
        </h2>
      </div>

      {/* Body - full content displayed */}
      <div className="px-5 py-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {announcement.body}
        </p>
      </div>

      {/* Media Gallery - if present */}
      {hasMedia && (
        <div className="px-5 py-3 bg-muted/30">
          <MediaGallery
            featured_image={announcement.featured_image_url}
            featured_image_alt={announcement.featured_image_alt}
            media={announcement.media}
            variant="card"
          />
        </div>
      )}

      {/* Footer: Metadata */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <IconCalendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{timeAgo}</span>
          </div>
          {announcement.expiresAt && (
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
              ⏰ Vence: {formatDate(announcement.expiresAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
