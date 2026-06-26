import CanvasClient from "@/components/CanvasClient";
import { getArtworks } from "@/lib/artworks";
import { runForceLayout } from "@/lib/canvas-layout";
import { getSitePage } from "@/lib/site-pages";

export default async function HomeCanvas() {
  const [artworks, home] = await Promise.all([getArtworks(), getSitePage("home")]);
  const initialNodes = runForceLayout(artworks);
  return (
    <CanvasClient
      artworks={artworks}
      initialNodes={initialNodes}
      intro={{ ja: home.lead.ja, en: home.lead.en }}
    />
  );
}
