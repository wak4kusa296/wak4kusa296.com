"use client";

import type { CSSProperties, ReactNode } from "react";
import { MEDIA_COVER_CLASS } from "@/lib/media-cover";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 親から整数 px が分かるとき（キャンバスカード等） */
  widthPx?: number;
  heightPx?: number;
  /** 親コンテナいっぱいに広げる（masonry 等） */
  fill?: boolean;
};

/** 画像・動画を cover 表示するコンテナ */
export default function MediaCover({ children, className, style, widthPx, heightPx, fill }: Props) {
  const fixed = widthPx != null && heightPx != null;
  const useFill = fill ?? !fixed;

  const classes = [
    MEDIA_COVER_CLASS,
    useFill ? "media-cover--fill" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const coverStyle: CSSProperties = {
    ...style,
    ...(fixed
      ? {
          width: widthPx,
          height: heightPx,
          ["--media-cover-w" as string]: `${widthPx}px`,
          ["--media-cover-h" as string]: `${heightPx}px`,
        }
      : {}),
  };

  return (
    <div className={classes} style={coverStyle}>
      {children}
    </div>
  );
}
