import { unstable_cache } from "next/cache";
import {
  getNotionJournalEntries,
  getNotionJournalEntryContent,
  type NotionJournalEntry,
} from "@/lib/notion";

type FallbackJournalEntry = NotionJournalEntry & { contentMd: string };

const FALLBACK_ENTRIES: FallbackJournalEntry[] = [
  {
    id: "1",
    date: "2024-05-10",
    title: { ja: "IDMOシリーズを描き始めた理由", en: "Why I Started the IDMO Series" },
    excerpt: "山の上に都市があったら、という問いから始まった。",
    contentMd: "山の上に都市があったら、という問いから始まった。",
  },
  {
    id: "2",
    date: "2024-03-22",
    title: { ja: "キントキ新山の温泉街", en: "Hot Spring Town of Kintoki-Shinzan" },
    excerpt: "温泉と古い街並みの組み合わせが好きで、ひとつの世界を作った。",
    contentMd: "温泉と古い街並みの組み合わせが好きで、ひとつの世界を作った。",
  },
  {
    id: "3",
    date: "2024-01-08",
    title: { ja: "かぎのこの港について", en: "On the Port of Kaginoko" },
    excerpt: "鍵の形をした入り江。最初はただのラクガキだった。",
    contentMd: "鍵の形をした入り江。最初はただのラクガキだった。",
  },
];

const getCachedJournal = unstable_cache(
  () => getNotionJournalEntries(),
  ["notion-journal"],
  { revalidate: 60 }
);

export type JournalEntry = NotionJournalEntry;

export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    const remote = await getCachedJournal();
    if (remote.length > 0) return remote;
  } catch (error) {
    console.warn("Notion journal fetch failed; fallback to local data", error);
  }
  return FALLBACK_ENTRIES;
}

export async function getJournalEntryContent(id: string): Promise<string> {
  const fallback = FALLBACK_ENTRIES.find((entry) => entry.id === id);
  if (fallback) return fallback.contentMd;

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
