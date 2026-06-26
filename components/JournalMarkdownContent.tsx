import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Element } from "hast";
import type { Schema } from "hast-util-sanitize";

import JournalEmbed from "@/components/JournalEmbed";
import {
  isEmbeddableMediaUrl,
  normalizeJournalEmbeds,
  parseEmbedMarkdownToken,
  parseEmbedPayload,
} from "@/lib/journal-embed-markdown";

const journalSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "figure",
    "figcaption",
    "video",
    "audio",
    "iframe",
    "img",
    "div",
  ],
  attributes: {
    ...defaultSchema.attributes,
    figure: ["class"],
    figcaption: [],
    div: ["class", "dataJournalEmbed"],
    img: ["src", "alt", "loading", "decoding", "class"],
    video: ["src", "controls", "playsinline", "preload", "class"],
    audio: ["src", "controls", "preload", "class"],
    iframe: ["src", "title", "allow", "allowfullscreen", "loading", "referrerpolicy", "class"],
    span: ["class"],
    table: ["class"],
    thead: [],
    tbody: [],
    tr: [],
    th: ["class", "scope"],
    td: ["class"],
  },
};

type Props = {
  content: string;
  className?: string;
};

function renderEmbedDiv(node: Element | undefined) {
  const encoded = node?.properties?.dataJournalEmbed;
  if (typeof encoded !== "string") return null;
  const payload = parseEmbedPayload(encoded);
  if (!payload) return null;
  return <JournalEmbed url={payload.url} layout={payload.layout} />;
}

export default function JournalMarkdownContent({ content, className = "journal-prose" }: Props) {
  if (!content.trim()) return null;

  const normalizedContent = normalizeJournalEmbeds(content);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, journalSanitizeSchema]]}
        components={{
          div: ({ node }) => renderEmbedDiv(node) ?? <div />,
          a: ({ href, children }) => {
            const legacyUrl = parseEmbedMarkdownToken(href);
            if (legacyUrl) return <JournalEmbed url={legacyUrl} />;
            if (href && isEmbeddableMediaUrl(href)) return <JournalEmbed url={href} />;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          iframe: ({ src }) => {
            if (typeof src !== "string" || !src) return null;
            return <JournalEmbed url={src} />;
          },
          video: ({ src }) => {
            if (typeof src === "string" && isEmbeddableMediaUrl(src)) {
              return <JournalEmbed url={src} />;
            }
            if (typeof src !== "string" || !src) return null;
            return (
              <figure className="journal-media journal-media--video">
                <video controls playsInline preload="metadata" src={src} />
              </figure>
            );
          },
          img: ({ src, alt }) => (
            <figure className="journal-media journal-media--image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" />
            </figure>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
