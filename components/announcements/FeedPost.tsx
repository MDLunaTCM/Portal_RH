"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import {
  IconCalendar,
  IconMegaphone,
  IconThumbsUp,
  IconMessageSquare,
  IconShare2,
} from "@/components/icons";
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
  onClick?: () => void;
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

export function FeedPost({ announcement }: FeedPostProps) {
  const [liked, setLiked] = useState(false);
  const priorityVariant = PRIORITY_VARIANT[(announcement.priority as any) || "normal"] ?? "info";
  const timeAgo = formatTimeAgo(announcement.publishedAt);
  const hasMedia = announcement.featured_image_url || announcement.media?.length;

  return (
    <div className="feed-post-card">
      {/* Header with profile and badges */}
      <div className="feed-post-header">
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="feed-post-author-avatar" />
              <div className="flex flex-col gap-0.5">
                <h3 className="feed-post-author-name">Recursos Humanos</h3>
                <p className="feed-post-timestamp">{timeAgo}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
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
              {announcement.category && (
                <Badge variant="default" className="shrink-0">
                  {announcement.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="feed-post-title-section">
        <h2 className="feed-post-title">{announcement.title}</h2>
      </div>

      {/* Body - full content displayed */}
      <div className="feed-post-body">
        <p className="feed-post-content">{announcement.body}</p>
      </div>

      {/* Media Gallery - if present */}
      {hasMedia && (
        <div className="feed-post-media">
          <MediaGallery
            featured_image={announcement.featured_image_url}
            featured_image_alt={announcement.featured_image_alt}
            media={announcement.media}
            variant="card"
          />
        </div>
      )}

      {/* Expiration notice */}
      {announcement.expiresAt && (
        <div className="feed-post-expiration">
          <IconCalendar className="w-4 h-4" />
          <span>Vence: {formatDate(announcement.expiresAt)}</span>
        </div>
      )}

      {/* Engagement stats */}
      <div className="feed-post-stats">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>123 me gusta</span>
          <span>•</span>
          <span>45 comentarios</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="feed-post-actions">
        <button
          onClick={() => setLiked(!liked)}
          className={`feed-post-action-btn ${liked ? "feed-post-action-active" : ""}`}
        >
          <IconThumbsUp className="w-5 h-5" />
          <span>Me gusta</span>
        </button>
        <button className="feed-post-action-btn">
          <IconMessageSquare className="w-5 h-5" />
          <span>Comentar</span>
        </button>
        <button className="feed-post-action-btn">
          <IconShare2 className="w-5 h-5" />
          <span>Compartir</span>
        </button>
      </div>
    </div>
  );
}
