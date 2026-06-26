import sizeOf from "image-size";
import { open, readFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_ASPECT_RATIO = 2 / 3;
const DEFAULT_VIDEO_RATIO = 16 / 9;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|$)/i;
const PROBE_BYTES = 512 * 1024;

function isVideo(src: string, mediaType?: "image" | "video") {
  return mediaType === "video" || VIDEO_EXT.test(src);
}

async function fetchRange(url: string, range: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { Range: range },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function loadRemoteBuffer(src: string, video: boolean): Promise<Buffer | null> {
  if (video) {
    const head = await fetchRange(src, `bytes=0-${PROBE_BYTES - 1}`);
    const tail = await fetchRange(src, `bytes=-${PROBE_BYTES}`);
    if (head && tail) return Buffer.concat([head, tail]);
    return head ?? tail;
  }
  return fetchRange(src, `bytes=0-${PROBE_BYTES - 1}`);
}

async function loadLocalBuffer(src: string, video: boolean): Promise<Buffer | null> {
  const localPath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  if (!video) return readFile(localPath);

  const fh = await open(localPath, "r");
  try {
    const { size } = await fh.stat();
    const headLen = Math.min(PROBE_BYTES, size);
    const head = Buffer.alloc(headLen);
    await fh.read(head, 0, headLen, 0);

    if (size <= PROBE_BYTES) return head;

    const tailLen = Math.min(PROBE_BYTES, size);
    const tail = Buffer.alloc(tailLen);
    await fh.read(tail, 0, tailLen, size - tailLen);
    return Buffer.concat([head, tail]);
  } finally {
    await fh.close();
  }
}

async function loadBuffer(src: string, mediaType?: "image" | "video"): Promise<Buffer | null> {
  const video = isVideo(src, mediaType);
  try {
    if (src.startsWith("/")) return await loadLocalBuffer(src, video);
    if (src.startsWith("http")) return await loadRemoteBuffer(src, video);
  } catch {
    return null;
  }
  return null;
}

function readMp4AspectRatio(buffer: Buffer): number | null {
  let offset = 0;
  let guard = 0;
  while (offset + 8 <= buffer.length && guard++ < 10_000) {
    const size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (size < 8) break;
    const end = Math.min(buffer.length, offset + size);

    if (type === "tkhd") {
      const version = buffer.readUInt8(offset + 8);
      const base = offset + 8 + 1 + 3;
      if (version === 0 && base + 76 <= end) {
        const width = buffer.readUInt32BE(base + 52) / 65536;
        const height = buffer.readUInt32BE(base + 56) / 65536;
        if (width > 0 && height > 0) return width / height;
      }
      if (version === 1 && base + 88 <= end) {
        const width = buffer.readUInt32BE(base + 64) / 65536;
        const height = buffer.readUInt32BE(base + 68) / 65536;
        if (width > 0 && height > 0) return width / height;
      }
    }

    if (type === "moov" || type === "trak" || type === "mdia" || type === "minf" || type === "stbl") {
      offset += 8;
      continue;
    }
    offset = end;
  }
  return null;
}

async function detectFromBuffer(
  buffer: Buffer,
  src: string,
  mediaType?: "image" | "video"
): Promise<number | null> {
  if (isVideo(src, mediaType)) {
    return readMp4AspectRatio(buffer);
  }
  try {
    const dim = sizeOf(buffer);
    if (dim.width && dim.height) return dim.width / dim.height;
  } catch {
    return null;
  }
  return null;
}

export async function getMediaAspectRatio(
  src: string,
  mediaType?: "image" | "video"
): Promise<number> {
  if (!src) return DEFAULT_ASPECT_RATIO;

  const video = isVideo(src, mediaType);
  const buffer = await loadBuffer(src, mediaType);
  if (!buffer) return video ? DEFAULT_VIDEO_RATIO : DEFAULT_ASPECT_RATIO;

  const ratio = await detectFromBuffer(buffer, src, mediaType);
  if (ratio && Number.isFinite(ratio) && ratio > 0) return ratio;
  return video ? DEFAULT_VIDEO_RATIO : DEFAULT_ASPECT_RATIO;
}

export async function enrichArtworkAspectRatios<
  T extends { src: string; mediaType?: "image" | "video"; aspectRatio?: number },
>(items: T[]): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      try {
        return {
          ...item,
          aspectRatio: await getMediaAspectRatio(item.src, item.mediaType),
        };
      } catch {
        return item;
      }
    })
  );
}
