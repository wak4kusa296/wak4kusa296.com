import { Suspense } from "react";
import HomeCanvas from "@/components/HomeCanvas";
import Loading from "@/components/Loading";
import { SITE_HEADER_HEIGHT } from "@/lib/site-frame";

export const revalidate = 3600;

export default function Home() {
  return (
    <div style={{ height: `calc(100dvh - ${SITE_HEADER_HEIGHT}px)`, overflow: "hidden" }}>
      <Suspense fallback={<Loading fill />}>
        <HomeCanvas />
      </Suspense>
    </div>
  );
}
