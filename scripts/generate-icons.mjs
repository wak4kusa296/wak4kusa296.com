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

async function circularPng(input, size) {
  const masked = await sharp(input)
    .resize(size, size, { fit: "cover", position: "center" })
    .composite([{ input: circleMask(size), blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: masked, blend: "over" }])
    .png()
    .toBuffer();
}

async function main() {
  const sizes = [
    { name: "favicon-32.png", size: 32 },
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

  // Minimal ICO: 32px PNG embedded (widely supported)
  await writeFile(path.join(appDir, "favicon.ico"), buffers["favicon-32.png"]);
  console.log("wrote app/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
