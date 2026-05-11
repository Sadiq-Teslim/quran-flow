import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, Amiri_Quran } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const amiriQuran = Amiri_Quran({
  subsets: ["arabic"],
  variable: "--font-amiri-quran",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuranFlow — Beyond Ramadan",
  description:
    "A behavioral and educational system for lifelong Quran engagement.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#10171A" },
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
      className={`${inter.variable} ${sourceSerif.variable} ${amiriQuran.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
