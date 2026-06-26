import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

import { configureJournalNotionToMarkdown } from "@/lib/notion-journal-markdown";

function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error("NOTION_API_KEY is not configured");
  }
  return new Client({ auth: apiKey });
}

export async function getNotionPageMarkdown(pageId: string): Promise<string> {
  const notion = getNotionClient();
  const n2m = configureJournalNotionToMarkdown(new NotionToMarkdown({ notionClient: notion }), notion);
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const { parent } = n2m.toMarkdownString(mdBlocks);
  return parent.trim();
}
