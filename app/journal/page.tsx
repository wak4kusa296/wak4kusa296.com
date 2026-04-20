import { getAchievements, type Achievement } from "@/lib/content";
import JournalClient from "@/components/JournalClient";

export default async function JournalPage() {
  const achievements = await getAchievements();
  const timeline = [...(achievements as Achievement[])].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date, "ja");
    return b.id.localeCompare(a.id, "ja");
  });

  return (
    <div className="page-fade page-container py-20">
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="font-bold" style={{ fontSize: "20px" }}>
            ジャーナル
          </h1>
          <p className="text-[#888888]" style={{ fontSize: "12px" }}>
            受注した案件や参加した企画をまとめています。
          </p>
        </div>

        <JournalClient items={timeline} />
      </div>
    </div>
  );
}
