function normalizeServiceDomain(input?: string) {
  if (!input) return "";
  return input
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .replace(/\.microcms\.io$/, "");
}

const serviceDomain = normalizeServiceDomain(process.env.MICROCMS_SERVICE_DOMAIN);
const readApiKey = process.env.MICROCMS_API_KEY;

function canUseMicrocms() {
  return Boolean(serviceDomain && readApiKey);
}

export async function fetchMicrocmsList<T>(endpoint: string): Promise<T[]> {
  if (!canUseMicrocms()) return [];

  const res = await fetch(
    `https://${serviceDomain}.microcms.io/api/v1/${endpoint}?limit=100`,
    {
      headers: {
        "X-MICROCMS-API-KEY": readApiKey as string,
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    throw new Error(`microCMS fetch failed: ${endpoint} (${res.status})`);
  }

  const data = (await res.json()) as { contents?: T[] };
  return data.contents ?? [];
}

export function getMicrocmsServiceDomain() {
  return serviceDomain;
}
