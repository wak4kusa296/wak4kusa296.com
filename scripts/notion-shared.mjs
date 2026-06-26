import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..");

export function loadEnvLocal() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

export const NOTION_VERSION = "2022-06-28";

export function normalizeId(id) {
  if (!id) return "";
  return id.replace(/-/g, "");
}

export function formatId(id) {
  const c = normalizeId(id);
  return `${c.slice(0, 8)}-${c.slice(8, 12)}-${c.slice(12, 16)}-${c.slice(16, 20)}-${c.slice(20)}`;
}

export async function notion(path, { method = "GET", body } = {}) {
  const apiKey = process.env.NOTION_API_KEY;
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${data.message ?? JSON.stringify(data)}`);
  }
  return data;
}

export function dbId(name) {
  const key = `NOTION_DB_${name.toUpperCase()}`;
  const id = process.env[key];
  if (!id) throw new Error(`${key} が .env.local にありません`);
  return formatId(id);
}

/** Notion AI オートフィル設定手順（API では設定不可） */
export const AI_AUTOFILL_GUIDE = `
━━━ Notion AI オートフィル設定 ━━━
※ API では設定できないため、Notion 上で各プロパティを手動設定してください。
※ Business / Enterprise プランで利用可能です。

【共通手順】
  1. データベースで対象の「英語」列ヘッダーにホバー
  2. 列名をクリック → 「AI オートフィル」
  3. 「翻訳」→ 言語「英語」
  4. 参照元に対応する日本語列を指定（カスタムの場合は下記プロンプト）

【世界観】
  • 説明（英） ← 説明（日） を翻訳

【作品（世界観）】
  • タイトル（英）   ← タイトル（日）
  • キャプション（英） ← キャプション（日）

【ジャーナル】
  • タイトル（英） ← タイトル（日）
  • 抜粋（英）     ← 抜粋（日）

設定後、行を編集・保存すると英語列が自動生成されます。
`;
