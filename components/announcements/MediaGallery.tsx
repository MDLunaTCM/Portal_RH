"use client";

import { useState } from "react";
import type { AnnouncementMedia } from "@/modules/announcements/types";

interface MediaGalleryProps {
  media?: AnnouncementMedia[];
  featured_image?: string;
  featured_image_alt?: string;
  variant?: "featured" | "card";
}

export function MediaGallery({
  media,
  featured_image,
  featured_image_alt,
  variant = "card",
}: MediaGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Combine featured image + media images into one flat list for lightbox navigation
  const allImages = [
    ...(featured_image
      ? [{ id: "featured", url: featured_image, alt: featured_image_alt || "Imagen destacada" }]
      : []),
    ...(media?.filter((m) => m.type === "image") ?? []),
  ];

  if (!featured_image && !media?.length) return null;

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  // ── Build grid content (no early returns — lightbox must render alongside) ──

  let gridContent: React.ReactNode = null;

  if (variant === "featured" && featured_image) {
    gridContent = (
      <div className="relative w-full h-80 bg-muted overflow-hidden rounded-lg">
        <img
          src={featured_image}
          alt={featured_image_alt || "Imagen destacada"}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
          onClick={() => openLightbox(0)}
        />
      </div>
    );
  } else if (variant === "card") {
    if (allImages.length === 1) {
      // Single image — full width, no rounding (card handles it)
      gridContent = (
        <div className="w-full bg-muted overflow-hidden">
          <img
            src={allImages[0].url}
            alt={allImages[0].alt || "Imagen del anuncio"}
            className="w-full max-h-[500px] object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
            onClick={() => openLightbox(0)}
          />
        </div>
      );
    } else if (allImages.length === 2) {
      // Two images — side by side
      gridContent = (
        <div className="grid grid-cols-2 gap-0.5 w-full bg-muted">
          {allImages.map((img, idx) => (
            <div key={img.id || idx} className="overflow-hidden">
              <img
                src={img.url}
                alt={img.alt || "Imagen del anuncio"}
                className="w-full h-56 object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                onClick={() => openLightbox(idx)}
              />
            </div>
          ))}
        </div>
      );
    } else if (allImages.length >= 3) {
      // Three or more — asymmetric grid: first image large, rest stacked
      gridContent = (
        <div className="grid grid-cols-2 gap-0.5 w-full bg-muted">
          {/* First image — tall */}
          <div
            className="overflow-hidden cursor-zoom-in"
            style={{ gridRow: "span 2" }}
            onClick={() => openLightbox(0)}
          >
            <img
              src={allImages[0].url}
              alt={allImages[0].alt || "Imagen del anuncio"}
              className="w-full h-full object-cover hover:opacity-95 transition-opacity"
              style={{ minHeight: "224px" }}
            />
          </div>

          {/* Second + third images */}
          {allImages.slice(1, 3).map((img, idx) => (
            <div
              key={img.id || idx}
              className="overflow-hidden cursor-zoom-in relative"
              onClick={() => openLightbox(idx + 1)}
            >
              <img
                src={img.url}
                alt={img.alt || "Imagen del anuncio"}
                className="w-full h-28 object-cover hover:opacity-95 transition-opacity"
              />
              {/* "+N more" overlay on the last visible cell */}
              {idx === 1 && allImages.length > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    +{allImages.length - 3}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  // ── Lightbox ──

  const lightbox = lightboxOpen && selectedImageIndex !== null && (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
      onClick={() => setLightboxOpen(false)}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={allImages[selectedImageIndex]?.url ?? ""}
          alt={allImages[selectedImageIndex]?.alt ?? "Imagen"}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Prev / Next */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedImageIndex((prev) =>
                  prev === 0 ? allImages.length - 1 : (prev ?? 0) - 1,
                )
              }
              className="absolute left-[-56px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all text-lg"
              aria-label="Imagen anterior"
            >
              ←
            </button>
            <button
              onClick={() =>
                setSelectedImageIndex((prev) =>
                  prev === allImages.length - 1 ? 0 : (prev ?? 0) + 1,
                )
              }
              className="absolute right-[-56px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all text-lg"
              aria-label="Siguiente imagen"
            >
              →
            </button>
          </>
        )}

        {/* Close */}
        <button
          onClick={() => setLightboxOpen(false)}
          className="absolute top-[-48px] right-0 w-9 h-9 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {(selectedImageIndex ?? 0) + 1} / {allImages.length}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {gridContent}
      {lightbox}
    </>
  );
}
