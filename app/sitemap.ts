import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getWorlds } from "@/lib/worlds";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/worlds`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/journal`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/profile`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/commission`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  let worldRoutes: MetadataRoute.Sitemap = [];
  try {
    const worlds = await getWorlds();
    worldRoutes = worlds
      .filter((world) => Boolean(world.slug))
      .map((world) => ({
        url: `${SITE_URL}/worlds/${encodeURIComponent(world.slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch (error) {
    console.warn("sitemap: worlds fetch failed", error);
  }

  return [...staticRoutes, ...worldRoutes];
}
