"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import JournalMarkdownContent from "@/components/JournalMarkdownContent";
import type { JournalEntry } from "@/lib/journal";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";

type Props = {
  entries: JournalEntry[];
};

export default function JournalPageClient({ entries }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contentMd, setContentMd] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) {
      setContentMd("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setContentMd("");

    fetch(`/api/journal/${encodeURIComponent(selectedId)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load journal content");
        return res.json() as Promise<{ contentMd: string }>;
      })
      .then((data) => setContentMd(data.contentMd))
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        console.warn(error);
        setContentMd("");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [selectedId]);

  if (selected) {
    return (
      <article className="journal-detail">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          style={{
            fontFamily: FONT,
            fontSize: TYPE.small,
            color: GRAY,
            letterSpacing: "0.08em",
            background: "none",
            border: "none",
            padding: 0,
            marginBottom: "32px",
            cursor: "pointer",
          }}
        >
          ← 一覧に戻る
        </button>

        {loading ? (
          <Loading label="読み込み中…" fill />
        ) : (
          <>
            <div style={{ fontFamily: FONT, fontSize: TYPE.caption, color: GRAY, letterSpacing: "0.1em", marginBottom: "10px" }}>
              {selected.date}
            </div>
            <h2 style={{ fontFamily: FONT, fontSize: TYPE.titleMd, fontWeight: 700, color: DARK, margin: "0 0 4px", lineHeight: 1.4 }}>
              {selected.title.ja}
            </h2>
            <p style={{ fontFamily: FONT, fontSize: TYPE.small, color: GRAY, margin: "0 0 24px" }}>
              {selected.title.en}
            </p>
            <JournalMarkdownContent content={contentMd} />
          </>
        )}
      </article>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {entries.map((entry, i) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => setSelectedId(entry.id)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            borderBottom: i < entries.length - 1 ? "1px solid #CCCCCC" : "none",
            padding: "0 0 32px",
            marginBottom: "32px",
            cursor: "pointer",
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: TYPE.caption, color: GRAY, letterSpacing: "0.1em", marginBottom: "10px" }}>
            {entry.date}
          </div>
          <h2 style={{ fontFamily: FONT, fontSize: TYPE.titleMd, fontWeight: 700, color: DARK, margin: "0 0 4px", lineHeight: 1.4 }}>
            {entry.title.ja}
          </h2>
          <p style={{ fontFamily: FONT, fontSize: TYPE.small, color: GRAY, margin: "0 0 12px" }}>
            {entry.title.en}
          </p>
          {entry.excerpt ? (
            <p style={{ fontFamily: FONT, fontSize: TYPE.lead, color: DARK, lineHeight: 1.9, margin: 0 }}>
              {entry.excerpt}
            </p>
          ) : null}
        </button>
      ))}
    </div>
  );
}
