import type { Metadata, Viewport } from "next";
import { Amiri_Quran, Quicksand } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

const amiriQuran = Amiri_Quran({
  subsets: ["arabic"],
  variable: "--font-amiri-quran",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuranFlow - Beyond Ramadan",
  description:
    "A behavioral and educational system for lifelong Quran engagement.",
  icons: {
    icon: "/quranflow-icon.png",
    shortcut: "/quranflow-icon.png",
    apple: "/quranflow-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${amiriQuran.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
