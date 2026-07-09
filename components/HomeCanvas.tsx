import CanvasClient from "@/components/CanvasClient";
import { getArtworks } from "@/lib/artworks.server";
import { runForceLayout } from "@/lib/canvas-layout";
import { getSitePage, HOME_ICON_FALLBACK, type SitePageLink } from "@/lib/site-pages";

const DEFAULT_HOME_LINKS: SitePageLink[] = [
  { label: "MAP", url: "/" },
  { label: "GALLERY", url: "/worlds" },
  { label: "JOURNAL", url: "/journal" },
];

export default async function HomeCanvas() {
  const [artworks, home] = await Promise.all([getArtworks(), getSitePage("home")]);
  const initialNodes = runForceLayout(artworks);
  return (
    <CanvasClient
      artworks={artworks}
      initialNodes={initialNodes}
      hero={{
        icon: home.icon || HOME_ICON_FALLBACK,
        title: {
          ja: home.title.ja || "若草フクロウ",
          en: home.title.en || "Goto Tatsuya",
        },
        intro: { ja: home.lead.ja, en: home.lead.en },
        links: home.linkList ?? DEFAULT_HOME_LINKS,
      }}
    />
  );
}
