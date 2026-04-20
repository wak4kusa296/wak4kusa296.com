"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Work } from "./WorkGrid";

type Props = {
  work: Work;
  src: string;
  colSpan: number;
  rowSpan: number;
  onClick: () => void;
};

export default function WorkItem({ work, src, colSpan, rowSpan, onClick }: Props) {
  const [baseSrc, setBaseSrc] = useState(src);
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  const [overlayLoaded, setOverlayLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const FADE_MS = 450;

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
    <button
      onClick={onClick}
      className="group relative overflow-hidden bg-[#EEEEEE] cursor-pointer w-full h-full"
      style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
      aria-label={work.title}
    >
      <Image
        src={baseSrc}
        alt={work.title}
        width={800}
        height={800}
        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
        sizes="20vw"
      />
      {overlaySrc && (
        <Image
          src={overlaySrc}
          alt={work.title}
          width={800}
          height={800}
          onLoad={() => setOverlayLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain transition-[transform,opacity] duration-500 group-hover:scale-[1.02] ${
            overlayVisible ? "opacity-100" : "opacity-0"
          }`}
          sizes="20vw"
        />
      )}
    </button>
  );
}
