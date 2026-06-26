import { escapeHtml } from "@/lib/notion-media-html";

type RichTextItem = {
  plain_text: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
};

export function notionColorClass(color?: string): string | undefined {
  if (!color || color === "default") return undefined;
  return `notion-${color.replace(/_/g, "-")}`;
}

export function richTextToHtml(items: RichTextItem[]): string {
  return items
    .map((item) => {
      const annotations = item.annotations ?? {};
      let text = escapeHtml(item.plain_text);

      if (!text && !item.plain_text) return "";

      if (annotations.code) text = `<code>${text}</code>`;
      if (annotations.bold) text = `<strong>${text}</strong>`;
      if (annotations.italic) text = `<em>${text}</em>`;
      if (annotations.strikethrough) text = `<del>${text}</del>`;
      if (annotations.underline) text = `<u>${text}</u>`;

      const colorClass = notionColorClass(annotations.color);
      if (colorClass) {
        text = `<span class="${colorClass}">${text}</span>`;
      }

      return text;
    })
    .join("");
}
