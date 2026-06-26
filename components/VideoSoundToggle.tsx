"use client";

import { FONT, DARK, GRAY } from "@/lib/site-type";
import { useVideoAudio } from "./VideoAudioProvider";

type Props = {
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  "data-ui"?: string;
};

export default function VideoSoundToggle({ style, onClick, "data-ui": dataUi }: Props) {
  const { soundEnabled, toggleSound } = useVideoAudio();

  return (
    <button
      type="button"
      data-ui={dataUi}
      role="switch"
      aria-checked={soundEnabled}
      aria-label={soundEnabled ? "音声をオフにする" : "音声をオンにする"}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        toggleSound();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: "999px",
        padding: "10px 16px 10px 18px",
        cursor: "pointer",
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: 600,
        color: DARK,
        letterSpacing: "0.06em",
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      <span>音声</span>
      <span
        aria-hidden
        style={{
          position: "relative",
          width: "44px",
          height: "24px",
          borderRadius: "999px",
          background: soundEnabled ? DARK : "#CCCCCC",
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: soundEnabled ? "22px" : "2px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            transition: "left 0.2s ease",
          }}
        />
      </span>
      <span style={{ minWidth: "28px", color: soundEnabled ? DARK : GRAY }}>
        {soundEnabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
