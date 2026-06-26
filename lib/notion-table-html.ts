import type { Client } from "@notionhq/client";
import { getBlockChildren } from "notion-to-md/build/utils/notion";

import { notionColorClass, richTextToHtml } from "@/lib/notion-rich-text-html";

type RichTextCell = Array<{ plain_text: string; annotations?: { color?: string } }>;

function cellBackgroundClass(cell: RichTextCell): string | undefined {
  const colors = cell
    .map((item) => item.annotations?.color)
    .filter((color): color is string => Boolean(color && color !== "default"));
  if (colors.length === 0) return undefined;
  const first = colors[0];
  if (!first.endsWith("_background")) return undefined;
  if (!colors.every((color) => color === first)) return undefined;
  return notionColorClass(first);
}

function renderCell(cell: RichTextCell): string {
  const backgroundClass = cellBackgroundClass(cell);
  const items = backgroundClass
    ? cell.map((item) => {
        const color = item.annotations?.color;
        if (!color?.endsWith("_background")) return item;
        return {
          ...item,
          annotations: { ...item.annotations, color: "default" },
        };
      })
    : cell;
  const inner = richTextToHtml(items);
  if (backgroundClass) {
    return `<span class="${backgroundClass}">${inner}</span>`;
  }
  return inner;
}

type TableBlock = {
  id: string;
  table?: {
    has_column_header?: boolean;
    has_row_header?: boolean;
  };
};

type TableRowBlock = {
  type: string;
  table_row?: {
    cells: Array<Array<{ plain_text: string; annotations?: Parameters<typeof richTextToHtml>[0][0]["annotations"] }>>;
  };
};

export async function renderNotionTableHtml(block: TableBlock, notion: Client): Promise<string> {
  const rows = (await getBlockChildren(notion, block.id, 100)) as TableRowBlock[];
  const tableRows = rows.filter((row) => row.type === "table_row" && row.table_row?.cells);
  if (tableRows.length === 0) return "";

  const hasColumnHeader = Boolean(block.table?.has_column_header);
  const hasRowHeader = Boolean(block.table?.has_row_header);
  const headerRow = hasColumnHeader ? tableRows[0] : null;
  const bodyRows = hasColumnHeader ? tableRows.slice(1) : tableRows;

  const parts: string[] = ['<table class="journal-table">'];

  if (headerRow) {
    parts.push("<thead><tr>");
    for (const cell of headerRow.table_row!.cells) {
      parts.push(`<th scope="col">${renderCell(cell)}</th>`);
    }
    parts.push("</tr></thead>");
  }

  parts.push("<tbody>");
  for (const row of bodyRows) {
    parts.push("<tr>");
    row.table_row!.cells.forEach((cell, index) => {
      if (hasRowHeader && index === 0) {
        parts.push(`<th scope="row">${renderCell(cell)}</th>`);
      } else {
        parts.push(`<td>${renderCell(cell)}</td>`);
      }
    });
    parts.push("</tr>");
  }
  parts.push("</tbody></table>");

  return `\n\n${parts.join("")}\n\n`;
}
