/**
 * 既存 Notion CMS データベースを日本語プロパティ・タグに移行
 */

import { loadEnvLocal, notion, dbId, AI_AUTOFILL_GUIDE } from "./notion-shared.mjs";
import {
  DATABASE_SCHEMAS,
  DB_TITLES,
  PROPERTY_RENAMES,
  P,
  SELECT,
  toJaSelect,
} from "./notion-schema.mjs";

loadEnvLocal();

async function patchDatabase(id, body) {
  await notion(`/databases/${id}`, { method: "PATCH", body });
}

function buildRenameProps(db, renames) {
  const props = {};
  const skip = new Set(["Media Type", "Status", "Category"]);
  for (const [oldName, newName] of Object.entries(renames)) {
    if (skip.has(oldName)) continue;
    if (newName === null) {
      if (db.properties[oldName]) props[oldName] = null;
    } else if (db.properties[oldName] && oldName !== newName) {
      props[oldName] = { name: newName };
    }
  }
  return props;
}

async function ensureFilesColumn(db, props, name) {
  if (!db.properties[name]) props[name] = { files: {} };
}

async function ensureCheckboxColumn(db, props, name) {
  if (!db.properties[name]) props[name] = { checkbox: {} };
}

const EN_TO_JA_TAG = {
  illustration: "イラスト",
  "3dcg": "3DCG",
  branding: "ブランディング",
  web: "Web",
  journal: "ジャーナル",
  image: "画像",
  video: "動画",
  ACTIVE: "公開中",
  ARCHIVED: "アーカイブ",
  SEASONAL: "季節限定",
  PRESERVED: "保存",
  OPERATIONAL: "運用中",
};

function mergeSelectOptions(existingProp, targetNames, colors) {
  const existing = existingProp?.select?.options ?? [];
  return targetNames.map((name, i) => {
    const found = existing.find((o) => o.name === name);
    if (found) return { id: found.id, name: found.name, color: found.color };
    const enKey = Object.entries(EN_TO_JA_TAG).find(([, ja]) => ja === name)?.[0];
    if (enKey) {
      const byEn = existing.find((o) => o.name === enKey);
      if (byEn) return { id: byEn.id, name, color: byEn.color };
    }
    return { name, color: colors[i % colors.length] };
  });
}

function patchSelect(db, body, oldName, newName, targetNames, colors) {
  const prop = db.properties[newName] ?? db.properties[oldName];
  if (!prop) return;
  const key = prop.name;
  body.properties[key] = {
    ...(key !== newName ? { name: newName } : {}),
    select: { options: mergeSelectOptions(prop, targetNames, colors) },
  };
  if (key !== oldName) delete body.properties[oldName];
}

async function migrateDatabase(label, envKey) {
  const id = dbId(envKey);
  const db = await notion(`/databases/${id}`);
  const renames = PROPERTY_RENAMES[label] ?? {};
  const props = buildRenameProps(db, renames);
  const schema = DATABASE_SCHEMAS[label];

  // DB タイトル
  const body = { title: schema.title, properties: { ...props } };

  // 不足 files 列を追加
  if (label === "Worlds") {
    await ensureFilesColumn(db, body.properties, P.thumbnail);
    if (!db.properties[P.nameEn]) {
      body.properties[P.nameEn] = { rich_text: {} };
    }
  }
  if (label === "Artworks") {
    await ensureFilesColumn(db, body.properties, P.media);
    await ensureCheckboxColumn(db, body.properties, P.featured);
    if (db.properties["Aspect Ratio"]) body.properties["Aspect Ratio"] = null;
    if (db.properties["アスペクト比"]) body.properties["アスペクト比"] = null;
    for (const key of [
      "Class Code", "Class Label", "Coordinates",
      "分類コード", "分類ラベル", "座標",
    ]) {
      if (db.properties[key]) body.properties[key] = null;
    }
  }
  if (label === "Works") {
    for (const k of [P.mainImage, P.mono, P.flat, P.spia, P.shading]) {
      await ensureFilesColumn(db, body.properties, k);
    }
  }
  if (label === "Achievements") {
    await ensureFilesColumn(db, body.properties, P.thumbnail);
    await ensureFilesColumn(db, body.properties, P.gallery);
  }
  if (label === "Journal") {
    if (!db.properties[P.excerptEn]) {
      body.properties[P.excerptEn] = { rich_text: {} };
    }
    for (const key of [P.body, "Body", "本文"]) {
      if (db.properties[key]) body.properties[key] = null;
    }
  }
  if (label === "Pages") {
    await ensureFilesColumn(db, body.properties, P.icon);
    if (!db.properties[P.links]) {
      body.properties[P.links] = { rich_text: {} };
    }
  }

  // セレクトのタグを日本語化（リネームと同時に適用）
  if (label === "Artworks") {
    patchSelect(db, body, "Media Type", P.mediaType, Object.values(SELECT.mediaType), ["default", "purple"]);
    patchSelect(db, body, "Status", P.status, Object.values(SELECT.artworkStatus), ["green", "gray", "yellow", "brown", "blue"]);
  }
  if (label === "Works") {
    patchSelect(db, body, "Category", P.category, Object.values(SELECT.workCategory), ["default", "purple", "orange", "blue"]);
  }
  if (label === "Achievements") {
    patchSelect(db, body, "Category", P.category, Object.values(SELECT.achievementCategory), ["orange", "blue", "default", "gray"]);
  }

  if (Object.keys(body.properties).length || body.title) {
    await patchDatabase(id, body);
    console.log(`✓ ${DB_TITLES[label]} を更新`);
  } else {
    console.log(`• ${DB_TITLES[label]}: 変更なし`);
  }

  return id;
}

function selectValue(prop) {
  return prop?.select?.name ?? null;
}

async function updatePageSelect(pageId, propName, jaValue) {
  await notion(`/pages/${pageId}`, {
    method: "PATCH",
    body: { properties: { [propName]: { select: jaValue ? { name: jaValue } : null } } },
  });
}

function toJaFromRaw(map, raw) {
  if (!raw) return null;
  if (Object.values(map).includes(raw)) return raw;
  return toJaSelect(map, raw);
}

async function migratePageSelects(label, databaseId) {
  const db = await notion(`/databases/${databaseId}`);
  const pages = await notion(`/databases/${databaseId}/query`, {
    method: "POST",
    body: { page_size: 100 },
  });

  let count = 0;
  for (const page of pages.results) {
    const p = page.properties;
    if (label === "Artworks") {
      const mt = db.properties[P.mediaType]?.name ?? db.properties["Media Type"]?.name ?? P.mediaType;
      const st = db.properties[P.status]?.name ?? db.properties.Status?.name ?? P.status;
      const jaMt = toJaFromRaw(SELECT.mediaType, selectValue(p[mt]));
      const jaSt = toJaFromRaw(SELECT.artworkStatus, selectValue(p[st]));
      if (jaMt && jaMt !== selectValue(p[mt])) {
        await updatePageSelect(page.id, mt, jaMt);
        count++;
      }
      if (jaSt && jaSt !== selectValue(p[st])) {
        await updatePageSelect(page.id, st, jaSt);
        count++;
      }
    }
    if (label === "Works") {
      const cat = db.properties[P.category]?.name ?? db.properties.Category?.name ?? P.category;
      const ja = toJaFromRaw(SELECT.workCategory, selectValue(p[cat]));
      if (ja && ja !== selectValue(p[cat])) {
        await updatePageSelect(page.id, cat, ja);
        count++;
      }
    }
    if (label === "Achievements") {
      const cat = db.properties[P.category]?.name ?? db.properties.Category?.name ?? P.category;
      const ja = toJaFromRaw(SELECT.achievementCategory, selectValue(p[cat]));
      if (ja && ja !== selectValue(p[cat])) {
        await updatePageSelect(page.id, cat, ja);
        count++;
      }
    }
  }
  if (count) console.log(`  → ${DB_TITLES[label]}: ${count} 件のタグを日本語化`);
}

async function main() {
  if (!process.env.NOTION_API_KEY) {
    console.error("NOTION_API_KEY が未設定です");
    process.exit(1);
  }

  console.log("Notion CMS 日本語化マイグレーションを開始…\n");
  const ids = {};
  for (const key of ["Worlds", "Artworks", "Works", "Achievements", "Journal", "Pages"]) {
    ids[key] = await migrateDatabase(key, key === "Pages" ? "PAGES" : key.toUpperCase());
  }

  console.log("\nタグ値を日本語に更新中…");
  for (const key of ["Artworks", "Works", "Achievements"]) {
    await migratePageSelects(key, ids[key]);
  }

  console.log("\nマイグレーション完了。");
  console.log(AI_AUTOFILL_GUIDE);
}

main().catch((err) => {
  console.error("\n失敗:", err.message);
  process.exit(1);
});
