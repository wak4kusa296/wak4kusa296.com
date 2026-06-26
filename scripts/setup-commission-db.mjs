/**
 * お仕事依頼 DB を既存 Notion CMS に追加
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
import { DATABASE_SCHEMAS, DB_TITLES, P, SELECT } from "./notion-schema.mjs";

loadEnvLocal();

const API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = normalizeId(process.env.NOTION_PARENT_PAGE_ID);

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

function appendEnvCommissionId(commissionId) {
  const envPath = resolve(ROOT, ".env.local");
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  if (existing.includes("NOTION_DB_COMMISSIONS=")) {
    console.log("• NOTION_DB_COMMISSIONS は既に .env.local にあります");
    return;
  }
  writeFileSync(envPath, `${existing.trimEnd()}\nNOTION_DB_COMMISSIONS=${formatId(commissionId)}\n`);
  console.log("✓ .env.local に NOTION_DB_COMMISSIONS を追加しました");
}

async function syncCommissionTypeOptions(commissionDbId) {
  const db = await notion(`/databases/${formatId(commissionDbId)}`);
  const prop = db.properties[P.commissionType];
  if (!prop) {
    console.log("• 依頼種別プロパティが見つかりません。スキップします");
    return;
  }

  const targetNames = Object.values(SELECT.commissionType);
  const colors = ["default", "purple", "orange", "blue", "green", "gray"];
  const existing = prop.select?.options ?? [];
  const options = targetNames.map((name, i) => {
    const found = existing.find((o) => o.name === name);
    if (found) return { id: found.id, name: found.name, color: found.color };
    return { name, color: colors[i % colors.length] };
  });

  await notion(`/databases/${formatId(commissionDbId)}`, {
    method: "PATCH",
    body: {
      properties: {
        [P.commissionType]: { select: { options } },
      },
    },
  });
  console.log("✓ 依頼種別の選択肢を更新しました");
}

async function main() {
  if (!API_KEY || !PARENT_PAGE_ID) {
    console.error("NOTION_API_KEY / NOTION_PARENT_PAGE_ID を設定してください");
    process.exit(1);
  }

  let commissionDbId = process.env.NOTION_DB_COMMISSIONS;
  if (!commissionDbId) {
    console.log("お仕事依頼 DB を作成中…");
    commissionDbId = await createDatabase(DATABASE_SCHEMAS.Commissions);
    console.log(`✓ ${DB_TITLES.Commissions} → ${commissionDbId}`);
    appendEnvCommissionId(commissionDbId);
  } else {
    console.log(`• 既存のお仕事依頼 DB を使用: ${commissionDbId}`);
  }

  await syncCommissionTypeOptions(commissionDbId);
  await ensureCommissionProperties(commissionDbId);

  console.log("\n完了。開発サーバーを再起動してください。");
}

async function ensureCommissionProperties(commissionDbId) {
  const db = await notion(`/databases/${formatId(commissionDbId)}`);
  const properties = db.properties ?? {};
  const toAdd = {};

  if (!properties[P.nameReading]) {
    toAdd[P.nameReading] = { rich_text: {} };
  }

  if (Object.keys(toAdd).length === 0) {
    console.log("• お仕事依頼 DB のプロパティは最新です");
    return;
  }

  await notion(`/databases/${formatId(commissionDbId)}`, {
    method: "PATCH",
    body: { properties: toAdd },
  });
  console.log("✓ お仕事依頼 DB にプロパティを追加しました");
}

main().catch((err) => {
  console.error("\n失敗:", err.message);
  process.exit(1);
});
