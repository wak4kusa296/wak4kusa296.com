"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Work = {
  id: string;
  title: string;
  category: string;
  src: string;
  date?: string;
  year: number;
};

type Props = {
  work: Work;
  src: string;
  modes: ReadonlyArray<{
    key: "monotone" | "flat" | "spia" | "shading";
    label: string;
    icon: string;
  }>;
  currentMode: "monotone" | "flat" | "spia" | "shading";
  onSelectMode: (mode: "monotone" | "flat" | "spia" | "shading") => void;
  onClose: () => void;
};

export default function Lightbox({
  work,
  src,
  modes,
  currentMode,
  onSelectMode,
  onClose,
}: Props) {
  const [baseSrc, setBaseSrc] = useState(src);
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  const [overlayLoaded, setOverlayLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const FADE_MS = 450;

  const formatDisplayDate = () => {
    if (work.date) {
      const parsed = new Date(work.date);
      if (!Number.isNaN(parsed.getTime())) {
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, "0");
        const dd = String(parsed.getDate()).padStart(2, "0");
        return `${yyyy}.${mm}.${dd}`;
      }
    }
    return `${work.year}.01.01`;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (src === baseSrc) return;

    setOverlaySrc(src);
    setOverlayLoaded(false);
    setOverlayVisible(false);
  }, [src, baseSrc]);

  useEffect(() => {
    if (!overlaySrc || !overlayLoaded) return;

    const rafId = requestAnimationFrame(() => {
      setOverlayVisible(true);
    });
    const timeoutId = window.setTimeout(() => {
      setBaseSrc(overlaySrc);
      setOverlaySrc(null);
      setOverlayLoaded(false);
      setOverlayVisible(false);
    }, FADE_MS);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [overlaySrc, overlayLoaded]);

  return (
    <div
      className="fixed inset-0 lg:left-[25vw] z-50 bg-[#EEEEEE] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute top-4 right-3">
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center text-[#161616] text-xl font-black leading-none transition-opacity hover:opacity-70"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-h-[80vh] bg-[#EEEEEE] rounded">
          <Image
            src={baseSrc}
            alt={work.title}
            width={800}
            height={800}
            className="object-contain max-h-[80vh] w-auto mx-auto rounded"
            style={{ maxHeight: "80vh" }}
          />
          {overlaySrc && (
            <Image
              src={overlaySrc}
              alt={work.title}
              width={800}
              height={800}
              onLoad={() => setOverlayLoaded(true)}
              className={`absolute inset-0 object-contain max-h-[80vh] w-auto mx-auto rounded transition-opacity duration-500 ${
                overlayVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ maxHeight: "80vh" }}
            />
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[#161616] tracking-wide font-bold" style={{ fontSize: "12px" }}>
            {work.title}
          </p>
          <p className="text-[#161616]/70 tracking-wide" style={{ fontSize: "10px" }}>
            {formatDisplayDate()}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {modes.map((mode) => (
              <button
                key={mode.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode(mode.key);
                }}
                className={`h-7 w-7 p-0 transition-opacity hover:opacity-80 ${
                  currentMode === mode.key ? "opacity-100" : "opacity-40"
                }`}
                aria-label={`表示モードを${mode.label}に変更`}
                title={mode.label}
              >
                <Image
                  src={mode.icon}
                  alt={mode.label}
                  width={32}
                  height={32}
                  className="h-7 w-7 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
