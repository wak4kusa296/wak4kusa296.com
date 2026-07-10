"use client";

import Link from "next/link";
import { MEDIA_COVER_ASSET_CLASS } from "@/lib/media-cover";
import { proxyNotionImage } from "@/lib/img-proxy";
import { FRAME_CLASS } from "@/lib/site-frame";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";
import MediaCover from "./MediaCover";

type Props = {
  world: string;
  slug: string;
  count: number;
  thumbnail: string | null;
};

export default function WorldCard({ world, slug, count, thumbnail }: Props) {
  return (
    <Link href={`/worlds/${encodeURIComponent(slug)}`} style={{ textDecoration: "none", display: "block" }}>
      <div className={FRAME_CLASS} style={{ background: "#FFFFFF" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "3/2" }}>
          <MediaCover fill>
            {thumbnail ? (
              <img
                className={MEDIA_COVER_ASSET_CLASS}
                src={proxyNotionImage(thumbnail, 800)}
                alt={world}
                loading="lazy"
                decoding="async"
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <img
                className={MEDIA_COVER_ASSET_CLASS}
                src="/images/placeholder-wide.svg"
                alt=""
                aria-hidden
                style={{ objectFit: "cover", width: "100%", height: "100%", opacity: 0.5 }}
              />
            )}
          </MediaCover>
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ fontFamily: FONT, fontSize: TYPE.titleMd, fontWeight: 700, color: DARK, marginBottom: "4px" }}>
            {world}
          </div>
          <div style={{ fontFamily: FONT, fontSize: TYPE.caption, color: GRAY, letterSpacing: "0.08em" }}>
            {count} WORKS
          </div>
        </div>
      </div>
    </Link>
  );
}
