"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/oefeningen", label: "Oefeningen" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/cmdlets", label: "Cmdlets" },
  { href: "/theorie", label: "Theorie" },
  { href: "/examen", label: "Examen" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/cheatsheet", label: "Cheat-sheet" },
];

export default function NavTabs() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-0.5" role="tablist">
      {tabs.map((t) => {
        const active = path === t.href || (t.href !== "/" && path?.startsWith(t.href));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`nav-tab ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
