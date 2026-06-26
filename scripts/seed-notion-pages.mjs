/**
 * 固定ページ DB（Commission / Support）を既存 Notion CMS に追加
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadEnvLocal,
  notion,
  formatId,
  normalizeId,
  ROOT,
} from "./notion-shared.mjs";
import { DATABASE_SCHEMAS, DB_TITLES, P } from "./notion-schema.mjs";

loadEnvLocal();

const API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = normalizeId(process.env.NOTION_PARENT_PAGE_ID);

function rt(content) {
  return [{ type: "text", text: { content: String(content ?? "") } }];
}
function titleProp(name) { return { title: rt(name) }; }
function richTextProp(text) { return text ? { rich_text: rt(text) } : { rich_text: [] }; }
function checkboxProp(v) { return { checkbox: Boolean(v) }; }
function urlProp(url) { return url ? { url } : { url: null }; }

const PAGES_SEED = [
  {
    slug: "home",
    titleJa: "若草フクロウ",
    titleEn: "Goto Tatsuya",
    leadJa: "イラストレーター。架空の世界を地図や風景として描いています。",
    leadEn: "Illustrator drawing imaginary worlds as maps and landscapes.",
    bodyJa: "",
    linkUrl: "",
    linkLabel: "",
  },
  {
    slug: "commission",
    titleJa: "お仕事依頼",
    titleEn: "Request a Commission",
    leadJa: "イラスト制作・キャラクターデザイン・世界観設定・カバーアートなど、各種ご依頼を承っております。",
    leadEn: "Accepting commissions for illustration, character design, world-building, cover art, and more.",
    bodyJa: "",
    linkUrl: "",
    linkLabel: "",
  },
  {
    slug: "support",
    titleJa: "この世界を支える",
    titleEn: "Support These Worlds",
    leadJa: "IDMOや、キントキ新山や、かぎのこの港。\nこれらの世界は、継続的な制作活動によって少しずつ広がっています。",
    leadEn: "IDMO, Kintoki-Shinzan, the port of Kaginoko —\nthese worlds expand slowly through continued creative work.\nYour support makes that possible.",
    bodyJa: [
      "TIER-01|制作過程のスケッチ・ラフ公開|WIP sketches and rough drafts",
      "TIER-02|世界設定資料の先行公開|Early access to world-building documents",
      "TIER-03|高解像度データDL|High-resolution file downloads",
    ].join("\n"),
    linkUrl: "https://www.patreon.com",
    linkLabel: "PATREON で支援する",
  },
];

async function createDatabase(schema) {
  const db = await notion("/databases", {
    method: "POST",
    body: {
      parent: { type: "page_id", page_id: formatId(PARENT_PAGE_ID) },
      title: schema.title,
      properties: schema.properties,
    },
  });
  return db.id;
}

async function createPage(databaseId, properties) {
  return notion("/pages", {
    method: "POST",
    body: { parent: { type: "database_id", database_id: databaseId }, properties },
  });
}

function appendEnvPagesId(pagesId) {
  const envPath = resolve(ROOT, ".env.local");
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  if (existing.includes("NOTION_DB_PAGES=")) {
    console.log("• NOTION_DB_PAGES は既に .env.local にあります");
    return;
  }
  writeFileSync(envPath, `${existing.trimEnd()}\nNOTION_DB_PAGES=${formatId(pagesId)}\n`);
  console.log("✓ .env.local に NOTION_DB_PAGES を追加しました");
}

async function main() {
  if (!API_KEY || !PARENT_PAGE_ID) {
    console.error("NOTION_API_KEY / NOTION_PARENT_PAGE_ID を設定してください");
    process.exit(1);
  }

  let pagesDbId = process.env.NOTION_DB_PAGES;
  if (!pagesDbId) {
    console.log("固定ページ DB を作成中…");
    pagesDbId = await createDatabase(DATABASE_SCHEMAS.Pages);
    console.log(`✓ ${DB_TITLES.Pages} → ${pagesDbId}`);
    appendEnvPagesId(pagesDbId);
  } else {
    console.log(`• 既存の固定ページ DB を使用: ${pagesDbId}`);
  }

  const existing = await notion(`/databases/${formatId(pagesDbId)}/query`, {
    method: "POST",
    body: { page_size: 100 },
  });

  const existingSlugs = new Set(
    existing.results.map((page) => {
      const prop = page.properties[P.slug] ?? page.properties.Slug;
      const items = prop?.rich_text ?? [];
      return items.map((t) => t.plain_text).join("");
    })
  );

  for (const p of PAGES_SEED) {
    if (existingSlugs.has(p.slug)) {
      console.log(`• ${p.slug}: 既に存在するためスキップ`);
      continue;
    }
    await createPage(pagesDbId, {
      [P.titleJa]: titleProp(p.titleJa),
      [P.slug]: richTextProp(p.slug),
      [P.titleEn]: richTextProp(p.titleEn),
      [P.leadJa]: richTextProp(p.leadJa),
      [P.leadEn]: richTextProp(p.leadEn),
      [P.bodyJa]: richTextProp(p.bodyJa),
      [P.linkUrl]: urlProp(p.linkUrl),
      [P.linkLabel]: richTextProp(p.linkLabel),
      [P.published]: checkboxProp(true),
    });
    console.log(`✓ ${p.slug} を投入`);
  }

  console.log("\n完了。開発サーバーを再起動してください。");
}

main().catch((err) => {
  console.error("\n失敗:", err.message);
  process.exit(1);
});
