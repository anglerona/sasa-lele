// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme";
import { ToastRoot } from "@/components/ui/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastRoot>{children}</ToastRoot>
      </ThemeProvider>
    </SessionProvider>
  );
}
