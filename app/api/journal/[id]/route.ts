import { getJournalEntryContent } from "@/lib/journal";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const contentMd = await getJournalEntryContent(id);
  return Response.json({ contentMd });
}
