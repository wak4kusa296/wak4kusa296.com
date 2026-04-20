import HomeClient from "@/components/HomeClient";
import { getWorks } from "@/lib/content";

export default async function Home() {
  const works = await getWorks();
  return <HomeClient works={works} />;
}
