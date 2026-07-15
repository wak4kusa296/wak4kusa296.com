import type { Metadata } from "next";
import CommissionClient from "@/components/CommissionClient";
import { getSitePage } from "@/lib/site-pages";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "コミッション / お仕事のご依頼",
  description:
    "若草フクロウへのお仕事のご依頼・コミッション。デフォルメイラスト、背景・世界観デザイン、ストーリーやコンセプト設計などを承ります。",
  path: "/commission",
  keywords: ["コミッション", "お仕事のご依頼", "イラスト依頼", "若草フクロウ"],
});

export default async function CommissionPage() {
  const content = await getSitePage("commission");
  return <CommissionClient content={content} />;
}
