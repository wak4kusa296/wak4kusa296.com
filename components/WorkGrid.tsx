"use client";

import { useState, useRef, useEffect } from "react";
import WorkItem from "./WorkItem";
import Lightbox from "./Lightbox";

export type Work = {
  id: string;
  title: string;
  category: string;
  src: string;
  date?: string;
  srcs?: {
    monotone?: string;
    flat?: string;
    spia?: string;
    shading?: string;
  };
  year: number;
  colSpan?: number;
  rowSpan?: number;
};

type Props = {
  works: Work[];
  mode: "monotone" | "flat" | "spia" | "shading";
};

const DESKTOP_COLS = 6;
const MOBILE_COLS = 3;
const GAP = 8;
/** この幅以上でトップを 6 カラム */
const SIX_COL_MIN_WIDTH_PX = 650;
const modes = [
  { key: "monotone", label: "モノトーン", icon: "/images/mode-icons/monotone.png" },
  { key: "flat", label: "フラットカラー", icon: "/images/mode-icons/flat.png" },
  { key: "spia", label: "スピア", icon: "/images/mode-icons/spia.png" },
  { key: "shading", label: "シェーディング", icon: "/images/mode-icons/shading.png" },
] as const;

export default function WorkGrid({ works, mode }: Props) {
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [lightboxMode, setLightboxMode] = useState<
    "monotone" | "flat" | "spia" | "shading"
  >(mode);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(DESKTOP_COLS);
  const [rowHeight, setRowHeight] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const updateGrid = (width: number) => {
      const nextCols =
        window.innerWidth >= SIX_COL_MIN_WIDTH_PX ? DESKTOP_COLS : MOBILE_COLS;
      setCols(nextCols);
      setRowHeight((width - GAP * (nextCols - 1)) / nextCols);
    };

    const obs = new ResizeObserver(([entry]) => {
      updateGrid(entry.contentRect.width);
    });
    obs.observe(el);
    const onResize = () => updateGrid(el.getBoundingClientRect().width);
    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      obs.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <div
        ref={gridRef}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: rowHeight > 0 ? `${rowHeight}px` : "auto",
          gap: `${GAP}px`,
        }}
      >
        {works.map((work) => {
          const cs = Math.min(work.colSpan ?? 1, 3);
          const rs = Math.min(work.rowSpan ?? 1, 3);
          const displaySrc = work.srcs?.[mode] ?? work.src;
          return (
            <WorkItem
              key={work.id}
              work={work}
              src={displaySrc}
              colSpan={cs}
              rowSpan={rs}
              onClick={() => {
                setLightboxMode(mode);
                setSelectedWork(work);
              }}
            />
          );
        })}
      </div>

      {selectedWork && (
        <Lightbox
          work={selectedWork}
          src={selectedWork.srcs?.[lightboxMode] ?? selectedWork.src}
          modes={modes}
          currentMode={lightboxMode}
          onSelectMode={setLightboxMode}
          onClose={() => setSelectedWork(null)}
        />
      )}
    </>
  );
}
