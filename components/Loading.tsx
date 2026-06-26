import { FONT, GRAY, TYPE } from "@/lib/site-type";

type Props = {
  label?: string;
  fill?: boolean;
};

export default function Loading({ label = "LOADING…", fill = false }: Props) {
  return (
    <div
      className={`site-loading${fill ? " site-loading--fill" : ""}`}
      style={{
        color: GRAY,
        fontFamily: FONT,
        fontSize: TYPE.small,
        letterSpacing: "0.12em",
      }}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
