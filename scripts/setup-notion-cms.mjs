/**
 * wak4kusa296.com — Notion CMS セットアップ
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadEnvLocal,
  notion,
  formatId,
  normalizeId,
  ROOT,
  AI_AUTOFILL_GUIDE,
} from "./notion-shared.mjs";
import { DATABASE_SCHEMAS, DB_TITLES, P, SELECT, toJaSelect } from "./notion-schema.mjs";

loadEnvLocal();

const API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = normalizeId(process.env.NOTION_PARENT_PAGE_ID);

function rt(content) {
  return [{ type: "text", text: { content: String(content ?? "") } }];
}
function titleProp(name) { return { title: rt(name) }; }
function richTextProp(text) { return text ? { rich_text: rt(text) } : { rich_text: [] }; }
function numberProp(n) { return { number: n ?? null }; }
function dateProp(iso) { return iso ? { date: { start: iso } } : { date: null }; }
function selectProp(name) { return name ? { select: { name } } : { select: null }; }
function checkboxProp(v) { return { checkbox: Boolean(v) }; }

const WORLDS_SEED = [
  { name: "IDMO", slug: "idmo", ja: "山の上に都市がある世界。", en: "A world where a city rests atop the mountains.", sort: 1 },
  { name: "キントキ新山", slug: "kintoki-shinzan", ja: "温泉と古い街並みの世界。", en: "A world of hot springs and old streets.", sort: 2 },
  { name: "かぎのこ", slug: "kaginoko", ja: "鍵の形をした入り江の港町。", en: "A harbor town in a key-shaped inlet.", sort: 3 },
];

const JOURNAL_SEED = [
  { ja: "IDMOシリーズを描き始めた理由", en: "Why I Started the IDMO Series", date: "2024-05-10", excerpt: "山の上に都市があったら、という問いから始まった。" },
  { ja: "キントキ新山の温泉街", en: "Hot Spring Town of Kintoki-Shinzan", date: "2024-03-22", excerpt: "温泉と古い街並みの組み合わせが好きで、ひとつの世界を作った。" },
  { ja: "かぎのこの港について", en: "On the Port of Kaginoko", date: "2024-01-08", excerpt: "鍵の形をした入り江。最初はただのラクガキだった。" },
];

async function createDatabase(name, schema) {
  const db = await notion("/databases", {
    method: "POST",
    body: {
      parent: { type: "page_id", page_id: formatId(PARENT_PAGE_ID) },
      title: schema.title,
      properties: schema.properties,
    },
  });
  console.log(`✓ ${DB_TITLES[name]} → ${db.id}`);
  return db.id;
}

async function createPage(databaseId, properties) {
  return notion("/pages", {
    method: "POST",
    body: { parent: { type: "database_id", database_id: databaseId }, properties },
  });
}

function loadJson(rel) {
  return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
}

async function seedWorlds(dbId) {
  for (const w of WORLDS_SEED) {
    await createPage(dbId, {
      [P.name]: titleProp(w.name),
      [P.slug]: richTextProp(w.slug),
      [P.descJa]: richTextProp(w.ja),
      [P.descEn]: richTextProp(w.en),
      [P.sort]: numberProp(w.sort),
    });
  }
  console.log(`  seeded ${WORLDS_SEED.length} worlds`);
}

async function seedArtworks(dbId) {
  const items = loadJson("data/artworks.json");
  for (const a of items) {
    await createPage(dbId, {
      [P.artworkId]: titleProp(a.id),
      [P.titleJa]: richTextProp(a.title.ja),
      [P.titleEn]: richTextProp(a.title.en),
      [P.world]: selectProp(a.world),
      [P.date]: richTextProp(a.date),
      [P.mediaType]: selectProp(toJaSelect(SELECT.mediaType, a.mediaType ?? "image")),
      [P.captionJa]: richTextProp(a.caption.ja),
      [P.captionEn]: richTextProp(a.caption.en),
      [P.status]: selectProp(toJaSelect(SELECT.artworkStatus, a.status)),
      [P.published]: checkboxProp(true),
    });
  }
  console.log(`  seeded ${items.length} artworks`);
}

async function seedWorks(dbId) {
  const items = loadJson("data/works.json");
  for (const w of items) {
    await createPage(dbId, {
      [P.title]: titleProp(w.title),
      [P.category]: selectProp(toJaSelect(SELECT.workCategory, w.category)),
      [P.date]: dateProp(w.year ? `${w.year}-01-01` : null),
      [P.colSpan]: numberProp(w.colSpan ?? 1),
      [P.rowSpan]: numberProp(w.rowSpan ?? 1),
      [P.published]: checkboxProp(true),
    });
  }
  console.log(`  seeded ${items.length} works`);
}

async function seedAchievements(dbId) {
  const items = loadJson("data/achievements.json");
  for (const a of items) {
    await createPage(dbId, {
      [P.title]: titleProp(a.title),
      [P.date]: dateProp(a.date),
      [P.client]: richTextProp(a.client),
      [P.category]: selectProp(toJaSelect(SELECT.achievementCategory, a.category)),
      [P.summary]: richTextProp(a.summary),
      [P.published]: checkboxProp(true),
    });
  }
  console.log(`  seeded ${items.length} achievements`);
}

async function seedJournal(dbId) {
  for (const j of JOURNAL_SEED) {
    await createPage(dbId, {
      [P.titleJa]: titleProp(j.ja),
      [P.titleEn]: richTextProp(j.en),
      [P.date]: dateProp(j.date),
      [P.excerptJa]: richTextProp(j.excerpt),
      [P.published]: checkboxProp(true),
    });
  }
  console.log(`  seeded ${JOURNAL_SEED.length} journal entries`);
}

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

function urlProp(url) { return url ? { url } : { url: null }; }

async function seedPages(dbId) {
  for (const p of PAGES_SEED) {
    await createPage(dbId, {
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
  }
  console.log(`  seeded ${PAGES_SEED.length} site pages`);
}

function writeEnv(ids) {
  const envPath = resolve(ROOT, ".env.local");
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const kept = existing
    .split("\n")
    .filter((line) => {
      const key = line.split("=")[0]?.trim();
      return key && !key.startsWith("NOTION_") && !line.startsWith("# Notion CMS");
    })
    .join("\n")
    .trimEnd();

  const block = [
    "# Notion CMS (auto-generated by notion:setup)",
    `NOTION_API_KEY=${API_KEY}`,
    `NOTION_PARENT_PAGE_ID=${formatId(PARENT_PAGE_ID)}`,
    `NOTION_DB_WORLDS=${ids.Worlds}`,
    `NOTION_DB_ARTWORKS=${ids.Artworks}`,
    `NOTION_DB_WORKS=${ids.Works}`,
    `NOTION_DB_ACHIEVEMENTS=${ids.Achievements}`,
    `NOTION_DB_JOURNAL=${ids.Journal}`,
    `NOTION_DB_PAGES=${ids.Pages}`,
    `NOTION_DB_COMMISSIONS=${ids.Commissions}`,
  ].join("\n");

  writeFileSync(envPath, kept ? `${kept}\n\n${block}\n` : `${block}\n`);
  console.log("\n✓ .env.local を更新しました");
}

async function main() {
  if (!API_KEY || !PARENT_PAGE_ID) {
    console.error("NOTION_API_KEY / NOTION_PARENT_PAGE_ID を .env.local に設定してください");
    process.exit(1);
  }

  console.log("Notion CMS セットアップを開始します…\n");
  await notion(`/pages/${formatId(PARENT_PAGE_ID)}`);
  console.log("✓ 親ページへのアクセスを確認\n");

  const ids = {};
  for (const [name, schema] of Object.entries(DATABASE_SCHEMAS)) {
    ids[name] = await createDatabase(name, schema);
  }

  console.log("\nシードデータを投入中…");
  await seedWorlds(ids.Worlds);
  await seedArtworks(ids.Artworks);
  await seedWorks(ids.Works);
  await seedAchievements(ids.Achievements);
  await seedJournal(ids.Journal);
  await seedPages(ids.Pages);

  writeEnv(ids);
  console.log(AI_AUTOFILL_GUIDE);
}

main().catch((err) => {
  console.error("\nセットアップ失敗:", err.message);
  process.exit(1);
});
