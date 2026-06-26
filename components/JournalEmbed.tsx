import type { CSSProperties } from "react";

import { embedFigureWidth, type EmbedLayout } from "@/lib/embed-layout";
import { toEmbedUrl } from "@/lib/notion-media-html";

type Props = {
  url: string;
  caption?: string;
  layout?: EmbedLayout;
};

export default function JournalEmbed({ url, caption, layout }: Props) {
  const src = toEmbedUrl(url);
  const sized = Boolean(layout?.aspectRatio || layout?.height || layout?.width);
  const figureWidth = embedFigureWidth(layout);

  const figureStyle: CSSProperties = {
    width: figureWidth ?? (layout?.pageWidth || layout?.fullWidth ? "100%" : undefined),
    marginInline: figureWidth ? "auto" : undefined,
  };

  const embedStyle: CSSProperties = {};
  if (layout?.aspectRatio) {
    embedStyle.aspectRatio = String(layout.aspectRatio);
  } else if (layout?.height) {
    embedStyle.minHeight = layout.height;
  }

  return (
    <figure
      className={`journal-media journal-media--embed${sized ? " journal-media--sized" : ""}`}
      style={figureStyle}
    >
      <div className="journal-media__embed" style={embedStyle}>
        <iframe
          src={src}
          title={caption || "Embedded content"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
