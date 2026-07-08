"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Artwork } from "@/lib/artworks";
import { distributeMasonryColumns } from "@/lib/masonry-columns";
import ArtworkMedia from "./ArtworkMedia";
import PostcardPopup from "./PostcardPopup";

type Props = { items: Artwork[] };

function useMasonryColumnCount() {
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 480px)");
    const medium = window.matchMedia("(max-width: 767px)");

    const update = () => {
      if (narrow.matches) setColumnCount(1);
      else if (medium.matches) setColumnCount(2);
      else setColumnCount(3);
    };

    update();
    narrow.addEventListener("change", update);
    medium.addEventListener("change", update);
    return () => {
      narrow.removeEventListener("change", update);
      medium.removeEventListener("change", update);
    };
  }, []);

  return columnCount;
}

export default function WorldArtworkGrid({ items }: Props) {
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [ratios, setRatios] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((a) => [a.id, a.aspectRatio ?? 2 / 3]))
  );
  const columnCount = useMasonryColumnCount();

  const handleAspectRatio = useCallback((id: string, ratio: number) => {
    setRatios((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }));
  }, []);

  const columns = useMemo(
    () =>
      distributeMasonryColumns(items, columnCount, (artwork) => {
        const ratio = ratios[artwork.id] ?? artwork.aspectRatio ?? 2 / 3;
        return 1 / ratio;
      }),
    [items, columnCount, ratios]
  );

  return (
    <>
      <div className="masonry-grid">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="masonry-column">
            {column.map((artwork) => {
              const hovered = hoveredId === artwork.id;
              const ratio = ratios[artwork.id] ?? artwork.aspectRatio ?? 2 / 3;
              return (
                <div key={artwork.id} className="masonry-item">
                  <button
                    type="button"
                    className="masonry-card"
                    onClick={() =>
                      setSelected({
                        ...artwork,
                        aspectRatio: ratios[artwork.id] ?? artwork.aspectRatio,
                      })
                    }
                    onMouseEnter={() => setHoveredId(artwork.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    aria-label={artwork.title.ja}
                  >
                    <div className="masonry-media" style={{ aspectRatio: ratio }}>
                      <ArtworkMedia
                        src={artwork.src}
                        alt={artwork.title.ja}
                        mediaType={artwork.mediaType}
                        playing={hovered || selected?.id === artwork.id}
                        onAspectRatio={(r) => handleAspectRatio(artwork.id, r)}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selected && <PostcardPopup artwork={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
