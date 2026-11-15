"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "New report" },
  { href: "/larp-list", label: "Most wanted" },
  { href: "/stupid-api", label: "Records API" },
];

export default function NavTabs() {
  const path = usePathname();
  return (
    <nav className="dividers" aria-label="Sections">
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`divider ${active ? "on" : ""}`} aria-current={active ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
