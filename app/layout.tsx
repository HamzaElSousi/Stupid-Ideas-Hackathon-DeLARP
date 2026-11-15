import type { Metadata } from "next";
import Link from "next/link";
import FartyParty from "@/components/FartyParty";
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
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="masthead">
          <Link href="/" className="logo">
            De<span>LARP</span>
          </Link>
          <nav>
            <Link href="/" className="navbtn">🔎 Investigate</Link>
            <Link href="/larp-list" className="navbtn hot">🚨 LARP List</Link>
            <Link href="/stupid-api" className="navbtn">🤡 Stupid API</Link>
          </nav>
        </header>
        <div className="ticker" aria-hidden>
          <div>
            STEALTH FOUNDER = UNEMPLOYED ✦ "BUILDING IN AI" = HAS A CHATGPT TAB OPEN ✦ "HUMBLED TO ANNOUNCE" = NOT HUMBLE ✦
            "PRE-REVENUE" = NO REVENUE ✦ "SERIAL ENTREPRENEUR" = 4 DEAD DOMAINS ✦ "AGREE?" = PLEASE ENGAGE ✦ STEALTH FOUNDER =
            UNEMPLOYED ✦ "BUILDING IN AI" = HAS A CHATGPT TAB OPEN ✦ "HUMBLED TO ANNOUNCE" = NOT HUMBLE ✦
          </div>
        </div>
        <main>{children}</main>
        <footer className="foot">
          Built at the Stupid Ideas Hackathon, Ottawa, Nov 15 2026. No tech bros were harmed. Their aura, however, is gone.
        </footer>
        <FartyParty />
      </body>
    </html>
  );
}
