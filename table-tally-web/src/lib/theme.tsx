"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeSettings = {
  bgColor: string;          // hex like #ffffff
  forceBlackText: boolean;  // true => text-neutral-900
  setBgColor: (c: string) => void;
  setForceBlackText: (v: boolean) => void;
};

const ThemeCtx = createContext<ThemeSettings | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [bgColor, setBgColor] = useState("#ffffff");
  const [forceBlackText, setForceBlackText] = useState(false);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tt_theme");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.bgColor) setBgColor(parsed.bgColor);
        if (typeof parsed.forceBlackText === "boolean") setForceBlackText(parsed.forceBlackText);
      }
    } catch {}
  }, []);

  // persist + apply css vars
  useEffect(() => {
    try { localStorage.setItem("tt_theme", JSON.stringify({ bgColor, forceBlackText })); } catch {}
    document.documentElement.style.setProperty("--tt-bg", bgColor);
    document.documentElement.dataset.ttForceBlack = forceBlackText ? "1" : "0";
  }, [bgColor, forceBlackText]);

  const value = useMemo(()=>({ bgColor, forceBlackText, setBgColor, setForceBlackText }), [bgColor, forceBlackText]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeSettings() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useThemeSettings must be used within ThemeProvider");
  return ctx;
}
