import CommissionClient from "@/components/CommissionClient";
import { getSitePage } from "@/lib/site-pages";

export const revalidate = 60;

export default async function CommissionPage() {
  const content = await getSitePage("commission");
  return <CommissionClient content={content} />;
}
