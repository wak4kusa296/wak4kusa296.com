"use client";

import type { ReactNode } from "react";
import { VideoAudioProvider } from "./VideoAudioProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <VideoAudioProvider>{children}</VideoAudioProvider>;
}
