import type { Metadata } from "next";
import { Syne, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Joey Villarreal — Studio Joe",
  description:
    "Senior Software Quality Engineer. 10+ years shipping high-visibility releases across mobile, desktop, TV, wearable, and AR.",
  openGraph: {
    title: "Joey Villarreal — Studio Joe",
    description:
      "Senior Software Quality Engineer. Quality where it actually matters.",
    url: "https://studiojoe.dev",
    siteName: "Studio Joe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${ibmPlexMono.variable}`}>
      <body>
        <div aria-hidden="true" className="grain" />
        {children}
      </body>
    </html>
  );
}
