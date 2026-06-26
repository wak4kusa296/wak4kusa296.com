"use client";

import Image from "next/image";
import { useState } from "react";
import WorkGrid, { type Work } from "@/components/WorkGrid";

type Props = {
  works: Work[];
};

export default function HomeClient({ works }: Props) {
  const [mode, setMode] = useState<"monotone" | "flat" | "spia" | "shading">(
    "monotone"
  );
  const modes = [
    { key: "monotone", label: "モノトーン", icon: "/images/mode-icons/monotone.png" },
    { key: "flat", label: "フラットカラー", icon: "/images/mode-icons/flat.png" },
    { key: "spia", label: "スピア", icon: "/images/mode-icons/spia.png" },
    { key: "shading", label: "シェーディング", icon: "/images/mode-icons/shading.png" },
  ] as const;
  const currentIndex = modes.findIndex(({ key }) => key === mode);
  const nextMode = modes[(currentIndex + 1) % modes.length];

  return (
    <div className="page-fade page-container py-12">
      <div className="mb-12 h-7">
        <div className="fixed top-4 right-3 z-40 flex h-7 items-center rounded-[4px] px-0.5">
        <button
          onClick={() => setMode(nextMode.key)}
          className="h-7 w-7 p-0 transition-opacity hover:opacity-80"
          aria-label={`表示モードを${nextMode.label}に変更`}
          title={`次: ${nextMode.label}`}
        >
          <Image
            src={nextMode.icon}
            alt={`次のモード: ${nextMode.label}`}
            width={48}
            height={48}
            className="h-7 w-7 object-cover"
          />
        </button>
        </div>
      </div>
      <WorkGrid works={works} mode={mode} />
    </div>
  );
}
