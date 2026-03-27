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

  // Combine featured image + media gallery
  const allImages = [
    ...(featured_image ? [{ id: "featured", url: featured_image, alt: featured_image_alt || "Featured image" }] : []),
    ...(media?.filter((m) => m.type === "image") || []),
  ];

  const videos = media?.filter((m) => m.type === "video") || [];

  if (!featured_image && !media?.length) return null;

  // Featured variant: full-width hero image
  if (variant === "featured" && featured_image) {
    return (
      <div className="relative w-full h-80 bg-muted overflow-hidden rounded-lg">
        <img
          src={featured_image}
          alt={featured_image_alt || "Featured image"}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
          onClick={() => {
            setSelectedImageIndex(0);
            setLightboxOpen(true);
          }}
        />
      </div>
    );
  }

  // Card variant: responsive grid layout
  if (variant === "card") {
    // Single image: full width
    if (allImages.length === 1) {
      return (
        <div className="w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={allImages[0].url}
            alt={allImages[0].alt || "Announcement media"}
            className="w-full h-auto max-h-96 object-cover hover:opacity-90 transition-opacity cursor-pointer"
            onClick={() => {
              setSelectedImageIndex(0);
              setLightboxOpen(true);
            }}
          />
        </div>
      );
    }

    // Two images: side by side
    if (allImages.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 w-full">
          {allImages.map((img, idx) => (
            <div key={img.id || idx} className="overflow-hidden rounded-lg bg-muted">
              <img
                src={img.url}
                alt={img.alt || "Announcement media"}
                className="w-full h-40 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => {
                  setSelectedImageIndex(idx);
                  setLightboxOpen(true);
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    // Three or more images: grid with first image larger
    if (allImages.length >= 3) {
      return (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div
            className="col-span-1 row-span-2 overflow-hidden rounded-lg bg-muted cursor-pointer"
            onClick={() => {
              setSelectedImageIndex(0);
              setLightboxOpen(true);
            }}
          >
            <img
              src={allImages[0].url}
              alt={allImages[0].alt || "Announcement media"}
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </div>

          {allImages.slice(1, 3).map((img, idx) => (
            <div
              key={img.id || idx}
              className="overflow-hidden rounded-lg bg-muted cursor-pointer relative"
              onClick={() => {
                setSelectedImageIndex(idx + 1);
                setLightboxOpen(true);
              }}
            >
              <img
                src={img.url}
                alt={img.alt || "Announcement media"}
                className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
              />
              {idx === 1 && allImages.length > 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-semibold">+{allImages.length - 3}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  // Lightbox overlay
  {
    lightboxOpen && selectedImageIndex !== null && (
      <div
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={() => setLightboxOpen(false)}
      >
        <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
          <img
            src={allImages[selectedImageIndex]?.url || ""}
            alt={allImages[selectedImageIndex]?.alt || "Full size image"}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation buttons */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : (prev ?? 0) - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all"
                aria-label="Previous image"
              >
                ←
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : (prev ?? 0) + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all"
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}

          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {(selectedImageIndex ?? 0) + 1} / {allImages.length}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null;
}
