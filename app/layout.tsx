import type { Metadata } from "next";
import Link from "next/link";
import FartyParty from "@/components/FartyParty";
import NavTabs from "@/components/NavTabs";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeLARP",
  description: "Paste a LinkedIn or X post. We look for proof. They probably don't have any.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Narrow:wght@400;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="topbar">
          <Link href="/" className="logo-stamp" aria-label="DeLARP home">
            <b>DeLARP</b>
            <span>Bureau of Receipts</span>
          </Link>
          <NavTabs />
        </header>
        <main>{children}</main>
        <footer className="foot">
          Filed at the Stupid Ideas Hackathon, Ottawa, November 15, 2026. No tech bros were harmed. Their aura is another matter.
        </footer>
        <FartyParty />
      </body>
    </html>
  );
}
