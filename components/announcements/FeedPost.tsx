"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  IconCalendar,
  IconMegaphone,
  IconThumbsUp,
  IconMessageSquare,
  IconShare2,
  IconGlobe,
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
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
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

  return "hace unos segundos";
}

const MAX_BODY_PREVIEW = 300;

export function FeedPost({ announcement }: FeedPostProps) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const timeAgo = formatTimeAgo(announcement.publishedAt);
  const isUrgent = (announcement.priority as string) === "urgent";
  const isImportant = (announcement.priority as string) === "important";
  const isLong = announcement.body.length > MAX_BODY_PREVIEW;
  const bodyText =
    isLong && !expanded
      ? announcement.body.slice(0, MAX_BODY_PREVIEW).trimEnd() + "…"
      : announcement.body;
  const hasMedia =
    announcement.featured_image_url || announcement.media?.length;

  return (
    <article
      className={cn(
        "bg-card rounded-xl overflow-hidden mb-3 transition-shadow duration-200",
        "shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
        isUrgent
          ? "border-l-4 border-l-[var(--error-foreground)] border border-border/30"
          : isImportant
            ? "border-l-4 border-l-[var(--warning-foreground)] border border-border/30"
            : "border border-border/60",
      )}
    >
      {/* Urgent top banner */}
      {isUrgent && (
        <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/20">
          <span className="text-sm leading-none">🚨</span>
          <span className="text-[11px] font-bold text-error-foreground uppercase tracking-wider">
            Anuncio Urgente
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        {/* Avatar + meta */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar: brand initials */}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
            <span className="text-[11px] font-extrabold text-primary-foreground tracking-widest">
              RH
            </span>
          </div>

          <div className="min-w-0">
            {/* Author name + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground leading-none">
                Recursos Humanos
              </span>
              {announcement.pinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning-foreground bg-warning/15 px-1.5 py-0.5 rounded-full leading-none">
                  <IconMegaphone className="w-2.5 h-2.5" />
                  Fijado
                </span>
              )}
              {isImportant && !isUrgent && (
                <span className="text-[10px] font-semibold text-warning-foreground bg-warning/15 px-1.5 py-0.5 rounded-full leading-none">
                  Importante
                </span>
              )}
            </div>

            {/* Timestamp + globe + category */}
            <div className="flex items-center gap-1 mt-0.5 text-[12px] text-muted-foreground">
              <span>{timeAgo}</span>
              <span>·</span>
              <IconGlobe className="w-3 h-3" />
              {announcement.category && (
                <>
                  <span>·</span>
                  <span className="capitalize">{announcement.category}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Three-dot menu */}
        <button
          aria-label="Más opciones"
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors flex-shrink-0 text-base font-bold tracking-tight"
        >
          •••
        </button>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-3">
        <h2 className="text-[15px] font-semibold text-foreground mb-2 leading-snug">
          {announcement.title}
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
          {bodyText}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-primary font-semibold hover:underline focus:outline-none"
            >
              {expanded ? " Ver menos" : " Ver más"}
            </button>
          )}
        </p>
      </div>

      {/* ── Media — edge to edge, no side padding ── */}
      {hasMedia && (
        <div className="w-full border-t border-border/30 overflow-hidden">
          <MediaGallery
            featured_image={announcement.featured_image_url}
            featured_image_alt={announcement.featured_image_alt}
            media={announcement.media}
            variant="card"
          />
        </div>
      )}

      {/* ── Expiration notice ── */}
      {announcement.expiresAt && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-t border-warning/20 text-[12px] text-warning-foreground">
          <IconCalendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Disponible hasta el {formatDate(announcement.expiresAt)}</span>
        </div>
      )}

      {/* ── Reactions bar ── */}
      <div className="flex items-center justify-between px-4 py-2 text-[12px] text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            <span className="text-sm">👍</span>
            <span className="text-sm -ml-0.5">❤️</span>
            <span className="text-sm -ml-0.5">🎉</span>
          </div>
          <span>{liked ? "124" : "123"}</span>
        </div>
        <button className="hover:underline cursor-pointer">
          45 comentarios
        </button>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-stretch border-t border-border/40">
        <button
          onClick={() => setLiked(!liked)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold rounded-bl-xl transition-colors hover:bg-muted/60",
            liked ? "text-primary" : "text-muted-foreground",
          )}
        >
          <IconThumbsUp className="w-4 h-4" />
          Me gusta
        </button>

        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60">
          <IconMessageSquare className="w-4 h-4" />
          Comentar
        </button>

        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60 rounded-br-xl">
          <IconShare2 className="w-4 h-4" />
          Compartir
        </button>
      </div>
    </article>
  );
}
