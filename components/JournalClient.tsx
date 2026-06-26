"use client";

import { useState } from "react";
import Image from "next/image";
import type { Achievement } from "@/lib/content";
import { GRAY, TYPE } from "@/lib/site-type";

type Props = {
  items: Achievement[];
};

export default function JournalClient({ items }: Props) {
  const [selected, setSelected] = useState<Achievement | null>(null);

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  };

  const modalImages =
    selected?.images && selected.images.length > 0
      ? selected.images
      : selected?.thumbnail
        ? [selected.thumbnail]
        : [];

  return (
    <>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="cursor-pointer space-y-3"
            onClick={() => setSelected(item)}
          >
            <div className="frame relative aspect-square w-full overflow-hidden bg-[#FFFFFF] p-4">
              <Image
                src={item.thumbnail ?? "/images/placeholder-square.svg"}
                alt={item.title}
                fill
                className="object-contain p-4"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[#888888]" style={{ fontSize: TYPE.nav }}>
                {formatDate(item.date)}
              </p>
              <h2 className="font-bold" style={{ fontSize: TYPE.body }}>
                {item.title}
              </h2>
            </div>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 lg:left-[25vw] z-50 bg-[#EEEEEE] p-6"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-5 right-6 text-2xl text-[#161616] hover:opacity-70"
            aria-label="閉じる"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
          <div
            className="mx-auto mt-10 max-h-[85vh] max-w-4xl overflow-y-auto space-y-6 pr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <p className="text-[#888888]" style={{ fontSize: TYPE.nav }}>
                {formatDate(selected.date)}
              </p>
              <h2 className="font-bold" style={{ fontSize: TYPE.body }}>
                {selected.title}
              </h2>
              {selected.summary ? (
                <p style={{ fontSize: TYPE.body }}>{selected.summary}</p>
              ) : null}
            </div>
            {modalImages.map((src, idx) => (
              <div
                key={`${selected.id}-${idx}`}
                className="frame relative flex w-full items-center justify-center bg-[#FFFFFF] p-2"
              >
                <Image
                  src={src}
                  alt={`${selected.title} ${idx + 1}`}
                  width={1200}
                  height={1200}
                  className="h-auto max-h-[78vh] w-auto max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
