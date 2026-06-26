import { unstable_cache } from "next/cache";
import {
  getNotionJournalEntries,
  getNotionJournalEntryContent,
  type NotionJournalEntry,
} from "@/lib/notion";

const getCachedJournal = unstable_cache(
  () => getNotionJournalEntries(),
  ["notion-journal"],
  { revalidate: 60 }
);

export type JournalEntry = NotionJournalEntry;

export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    return await getCachedJournal();
  } catch (error) {
    console.warn("Notion journal fetch failed", error);
    return [];
  }
}

export async function getJournalEntryContent(id: string): Promise<string> {
  const getCachedContent = unstable_cache(
    () => getNotionJournalEntryContent(id),
    [`notion-journal-content-${id}`],
    { revalidate: 60 }
  );

  try {
    return await getCachedContent();
  } catch (error) {
    console.warn(`Failed to fetch journal content for "${id}"`, error);
    return "";
  }
}
