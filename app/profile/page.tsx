import { TYPE } from "@/lib/site-type";

const mailSubject = encodeURIComponent("お仕事のご依頼");
const mailBody = encodeURIComponent(
  [
    "若草フクロウ（五嶋龍也）様",
    "",
    "お世話になっております。お仕事のご相談です。",
    "",
    "【ご依頼内容】",
    "",
    "【ご希望納期】",
    "",
    "【ご予算】",
    "",
    "【掲載媒体 / 用途】",
    "",
    "【参考資料】",
    "",
    "【ご連絡先】",
    "",
    "どうぞよろしくお願いいたします。",
  ].join("\n")
);
const mailHref = `mailto:wak4kusa296@gmail.com?subject=${mailSubject}&body=${mailBody}`;

const sns = [
  { label: "note", href: "https://note.com/wak4kusa296" },
  { label: "YouTube (FUREL.tech)", href: "https://www.youtube.com/@wak4kusa296" },
  { label: "Instagram", href: "https://www.instagram.com/wak4kusa296/" },
];

export default function ProfilePage() {
  return (
    <div className="page-fade page-container py-20">
      <div className="space-y-12">
        <div className="space-y-2">
          <h1 className="font-bold" style={{ fontSize: TYPE.titleXl }}>経歴紹介</h1>
          <p className="mt-8 text-center font-bold text-[#161616]" style={{ fontSize: TYPE.titleXl }}>若草フクロウ（五嶋龍也）</p>
        </div>

        <div className="space-y-1">
          <p className="text-[#888888] tracking-widest uppercase" style={{ fontSize: TYPE.nav }}>title</p>
          <p style={{ fontSize: TYPE.body }}>
            イラストレーター / デジタルクリエイター / 作家
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[#888888] tracking-widest uppercase" style={{ fontSize: TYPE.nav }}>base</p>
          <p style={{ fontSize: TYPE.body }}>福岡県中間市</p>
        </div>

        <div className="space-y-2">
          <p className="text-[#888888] tracking-widest uppercase" style={{ fontSize: TYPE.nav }}>about</p>
          <p className="leading-loose max-w-xl" style={{ fontSize: TYPE.body }}>
            2003年3月1日生まれ。福岡県中間市出身。
            2021年にデジタルハリウッド大学へ入学し、高校時代から研究していたイラスト制作を軸に、
            グラフィックデザイン（スイススタイル）やWebデザイン、リアルタイムコンテンツなど、
            デジタル技術を用いたコンテンツ制作を学ぶ。
            2026年3月に同大学を首席卒業後、地元福岡を中心に活動を展開する。
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[#888888] tracking-widest uppercase" style={{ fontSize: TYPE.nav }}>award</p>
          <p style={{ fontSize: TYPE.body }}>
            JR東日本主催・Yamanote Line Museum イラストコンテスト 最優秀賞
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[#888888] tracking-widest uppercase" style={{ fontSize: TYPE.nav }}>sns</p>
          <ul className="space-y-2">
            {sns.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-50 transition-opacity"
                  style={{ fontSize: TYPE.body }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4">
          <a
            href={mailHref}
            className="inline-block tracking-widest uppercase border border-[#161616] px-8 py-3 hover:bg-[#161616] hover:text-[#EEEEEE] transition-colors rounded-[4px]"
            style={{ fontSize: TYPE.nav }}
          >
            メールで依頼する
          </a>
        </div>
      </div>
    </div>
  );
}
