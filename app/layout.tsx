import type { Metadata } from "next";
import { Syne, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
const syne = Syne({ subsets:["latin"], variable:"--font-syne", weight:["400","500","600","700","800"] });
const jetbrainsMono = JetBrains_Mono({ subsets:["latin"], variable:"--font-jetbrains", weight:["300","400","500","600"] });
const outfit = Outfit({ subsets:["latin"], variable:"--font-outfit", weight:["300","400","500","600"] });
export const metadata: Metadata = { title:"NEXUS OS — AI Command Interface", description:"Neural Executive eXperience Unified System" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable} ${outfit.variable} h-full`}>
      <body className="h-full overflow-hidden bg-void">{children}</body>
    </html>
  );
}
