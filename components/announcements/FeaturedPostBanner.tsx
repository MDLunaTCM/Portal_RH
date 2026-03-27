"use client";

import { Badge } from "@/components/ui";
import { IconMegaphone, IconCalendar } from "@/components/icons";
import { MediaGallery } from "./MediaGallery";
import type { BoardAnnouncement } from "@/modules/announcements/hooks/use-announcements-board";

interface FeaturedPostBannerProps {
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
  onViewDetails: () => void;
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

export function FeaturedPostBanner({
  announcement,
  onViewDetails,
}: FeaturedPostBannerProps) {
  const priorityVariant = PRIORITY_VARIANT[(announcement.priority as any) || "normal"] ?? "info";
  const timeAgo = formatTimeAgo(announcement.publishedAt);

  return (
    <div className="relative rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden hover:border-primary/50 transition-all shadow-lg hover:shadow-xl">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 lg:p-8">
        {/* Left: Content */}
        <div className="flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={priorityVariant}
                className="flex items-center gap-1"
              >
                <IconMegaphone className="w-3 h-3" />
                Destacado
              </Badge>
              {announcement.priority && (
                <Badge variant={priorityVariant}>
                  {announcement.priority === "urgent"
                    ? "Urgente"
                    : announcement.priority === "important"
                      ? "Importante"
                      : "General"}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              {announcement.title}
            </h2>

            {/* Excerpt/body preview */}
            <p className="text-base text-foreground/90 line-clamp-4 leading-relaxed">
              {announcement.body.slice(0, 200)}
              {announcement.body.length > 200 && "…"}
            </p>
          </div>

          {/* Footer: Meta + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-primary/20">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <IconCalendar className="w-4 h-4" />
                <span>{timeAgo}</span>
              </div>
              {announcement.expiresAt && (
                <div className="text-xs">
                  Vence: {formatDate(announcement.expiresAt)}
                </div>
              )}
            </div>

            <button
              onClick={onViewDetails}
              className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Leer más
            </button>
          </div>
        </div>

        {/* Right: Image */}
        {(announcement.featured_image_url || announcement.media?.length) && (
          <div className="flex items-center justify-center lg:h-96">
            <MediaGallery
              featured_image={announcement.featured_image_url}
              featured_image_alt={announcement.featured_image_alt}
              media={announcement.media}
              variant="featured"
            />
          </div>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
    </div>
  );
}
