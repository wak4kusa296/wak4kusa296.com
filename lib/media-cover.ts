/**
 * 画像・動画の object-fit:cover コンテナ用スタイル定数。
 * 実装は globals.css の .media-cover / .media-cover__asset を正とする。
 *
 * 新規に画像・映像コンテナを作るときは必ず `MediaCover` + `MEDIA_COVER_ASSET_CLASS`
 * を使うこと。サイズは整数 px（--media-cover-w/h）で指定し、% 指定は使わない。
 */

export const MEDIA_COVER_CLASS = "media-cover";
export const MEDIA_COVER_ASSET_CLASS = "media-cover__asset";
export const MEDIA_COVER_BG = "#ffffff";

/** @deprecated MEDIA_COVER_BG を使用 */
export const VIDEO_BG = MEDIA_COVER_BG;
