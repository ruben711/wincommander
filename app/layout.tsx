import "../styles/globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import NavTabs from "@/components/NavTabs";
import ThemeToggle from "@/components/ThemeToggle";
import ModeProvider from "@/components/ModeProvider";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "WinCommander — Computer Management oefenplatform",
  description:
    "Interactief oefenplatform voor Windows-administratie: PowerShell, CMD, services, processen, registry, netwerk en scripts. Veilig, in de browser.",
};

// Inline script om FOUC te voorkomen — zet theme VOOR React laadt.
const themeInitScript = `
(function() {
  try {
    var t = JSON.parse(localStorage.getItem('wincommander-theme') || '{}').state || {};
    var theme = t.theme || 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.documentElement.classList.add(resolved);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Lettertypes: Segoe UI (systeem) + Cascadia Code (lokaal op Windows),
            met web-veilige fallbacks. Geen render-blocking externe fonts —
            houdt de app snel en 100% offline-bruikbaar. */}
      </head>
      <body>
        <ModeProvider>
          <div className="min-h-screen flex flex-col">
            {/* ─── TOP BAR ───────────────────────────────────────── */}
            <header className="sticky top-0 z-40 h-14 border-b border-line bg-panel/85 backdrop-blur-xl">
              <div className="mx-auto max-w-6xl h-full px-5 flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="WinCommander home">
                  <span className="grid place-items-center w-8 h-8 rounded-md bg-brand text-[15px] font-mono font-bold shadow-fluent"
                        style={{ color: "rgb(var(--brand-fg))" }}>
                    {">_"}
                  </span>
                  <span className="hidden sm:flex flex-col leading-none">
                    <span className="text-[15px] font-semibold tracking-tight">WinCommander</span>
                    <span className="text-[10px] text-fg-dim font-mono">Computer Management</span>
                  </span>
                </Link>

                <div className="hidden md:block flex-1 overflow-x-auto">
                  <NavTabs />
                </div>

                <div className="ml-auto md:ml-0 flex items-center gap-2 shrink-0">
                  <ThemeToggle />
                </div>
              </div>
              {/* Mobiele nav */}
              <div className="md:hidden border-t border-line overflow-x-auto">
                <div className="px-3 py-1"><NavTabs /></div>
              </div>
            </header>

            {/* ─── MAIN ──────────────────────────────────────────── */}
            <main className="flex-1">
              <div className="mx-auto max-w-6xl px-5 py-7">{children}</div>
            </main>

            <Footer />
          </div>
        </ModeProvider>
      </body>
    </html>
  );
}
