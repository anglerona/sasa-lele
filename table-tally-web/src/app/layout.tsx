import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SASA-LELE",
  description: "Bookkeeping for anime convention merchandise",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
  <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}