import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-nanum-myeongjo",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

export const metadata: Metadata = {
  title: "GridWall — Sticky Notes & Calendar",
  description: "A sticky notes wall and calendar. Organize notes, connect ideas, export as image.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-none">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${nanumMyeongjo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
