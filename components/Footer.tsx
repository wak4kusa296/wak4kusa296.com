import { GRAY, TYPE } from "@/lib/site-type";

export default function Footer() {
  return (
    <footer className="py-8 px-6 text-center">
      <p style={{ color: GRAY, fontSize: TYPE.nav }}>
        © {new Date().getFullYear()} 若草フクロウ / Wakakusa Fukurou
      </p>
    </footer>
  );
}
