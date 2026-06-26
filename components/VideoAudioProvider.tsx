"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "wak4kusa-video-sound";

type VideoAudioContextValue = {
  soundEnabled: boolean;
  muted: boolean;
  setSoundEnabled: (on: boolean) => void;
  toggleSound: () => void;
};

const VideoAudioContext = createContext<VideoAudioContextValue | null>(null);

function readStoredSound(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredSound(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

export function VideoAudioProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(false);

  useEffect(() => {
    setSoundEnabledState(readStoredSound());
  }, []);

  const setSoundEnabled = useCallback((on: boolean) => {
    setSoundEnabledState(on);
    writeStoredSound(on);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      writeStoredSound(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      soundEnabled,
      muted: !soundEnabled,
      setSoundEnabled,
      toggleSound,
    }),
    [soundEnabled, setSoundEnabled, toggleSound]
  );

  return <VideoAudioContext.Provider value={value}>{children}</VideoAudioContext.Provider>;
}

export function useVideoAudio() {
  const ctx = useContext(VideoAudioContext);
  if (!ctx) {
    return {
      soundEnabled: false,
      muted: true,
      setSoundEnabled: () => {},
      toggleSound: () => {},
    };
  }
  return ctx;
}
