import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");
const appDir = path.join(projectRoot, "app");

const source = process.argv[2];
if (!source) {
  console.error("Usage: node scripts/generate-icons.mjs <source-image>");
  process.exit(1);
}

function circleMask(size) {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
  );
}

/** 円形に切り抜き、外側は透明（ブラウザのタブで丸く見える） */
async function circularPng(input, size) {
  return sharp(input)
    .resize(size, size, { fit: "cover", position: "center" })
    .ensureAlpha()
    .composite([{ input: circleMask(size), blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function main() {
  const sizes = [
    { name: "icon.png", size: 32 },
    { name: "favicon-48.png", size: 48 },
    { name: "apple-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
  ];

  const buffers = {};
  for (const { name, size } of sizes) {
    buffers[name] = await circularPng(source, size);
    await writeFile(path.join(appDir, name), buffers[name]);
    console.log(`wrote app/${name}`);
  }

  await writeFile(path.join(appDir, "favicon.ico"), buffers["icon.png"]);
  console.log("wrote app/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
