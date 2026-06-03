import Link from "next/link";

const topics = [
  { h: "H1", t: "PowerShell-basis", d: "cmdlets, syntax, help, pipelines, variabelen", icon: "💠" },
  { h: "H2", t: "CMD legacy", d: "dir, cd, copy, del, tree, cls", icon: "⬛" },
  { h: "H3", t: "Bestandssysteem", d: "Get-ChildItem, Copy-Item, Test-Path", icon: "📁" },
  { h: "H4", t: "Filtering & sorteren", d: "Where-Object, Select, Sort, Group", icon: "🔎" },
  { h: "H5", t: "Services", d: "Get-Service, Start/Stop-Service", icon: "⚙️" },
  { h: "H6", t: "Processen", d: "Get-Process, Stop-Process", icon: "📊" },
  { h: "H7", t: "Gebruikersbeheer", d: "Get-LocalUser, net user", icon: "👤" },
  { h: "H8", t: "Registry", d: "Get-/Set-ItemProperty HKLM:\\…", icon: "🗝️" },
  { h: "H9", t: "Netwerk", d: "Test-Connection, ipconfig, tracert", icon: "🌐" },
  { h: "H10", t: "Event logs", d: "Get-EventLog, Get-WinEvent", icon: "📜" },
  { h: "H11", t: "Scripts", d: "functies, parameters, error-handling", icon: "📄" },
  { h: "H12", t: "Geplande taken", d: "Get-/Register-ScheduledTask", icon: "⏰" },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2 gap-8 items-center pt-2">
        <div>
          <span className="chip-brand mb-4">Computer Management · Windows-administratie</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Leer <span className="text-brand">PowerShell</span> &amp; CMD
            <br />door écht te typen.
          </h1>
          <p className="mt-4 text-fg-muted text-[15px] leading-relaxed max-w-lg">
            Schrijf commando&apos;s in een realistische Windows-terminal, krijg meteen
            feedback en gesimuleerde uitvoer. Veilig in je browser — geen installatie,
            niks dat je toestel raakt.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/oefeningen" className="btn-primary h-9 px-4">▸ Start met oefenen</Link>
            <Link href="/dashboard" className="btn h-9 px-4">Bekijk je dashboard</Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-2xs text-fg-dim">
            <span>✓ XP, levels &amp; streaks</span>
            <span>✓ Alias-tolerante grader</span>
            <span>✓ Light &amp; dark mode</span>
            <span>✓ € 0 — volledig client-side</span>
          </div>
        </div>

        {/* Decoratieve (statische) terminal-preview */}
        <div className="terminal">
          <div className="terminal-bar">
            <span className="terminal-dot" style={{ background: "#ff5f57" }} />
            <span className="terminal-dot" style={{ background: "#febc2e" }} />
            <span className="terminal-dot" style={{ background: "#28c840" }} />
            <span className="terminal-tab ml-2">⌨ PowerShell</span>
          </div>
          <div className="terminal-body font-mono">
            <div>
              <span className="term-prompt-ps">PS </span>
              <span className="term-prompt-path">C:\Users\Ruben</span>
              <span className="term-prompt-glyph">&gt; </span>
              <span className="tok-cmd">Get-Service</span>{" "}
              <span className="tok-op">|</span>{" "}
              <span className="tok-cmd">Where-Object</span>{" "}
              <span className="tok-param">Status</span>{" "}
              <span className="tok-op">-eq</span>{" "}
              <span className="tok-plain">Running</span>
            </div>
            <div className="term-output mt-2">
              {[
                "",
                "Status   Name        DisplayName",
                "------   ----        -----------",
                "Running  Audiosrv    Windows Audio",
                "Running  Dhcp        DHCP Client",
                "Running  Spooler     Print Spooler",
                "Running  Themes      Themes",
                "Running  Winmgmt     Windows Management Instrumentation",
              ].join("\n")}
            </div>
            <div className="mt-2">
              <span className="term-prompt-ps">PS </span>
              <span className="term-prompt-path">C:\Users\Ruben</span>
              <span className="term-prompt-glyph">&gt; </span>
              <span className="term-caret" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TOPICS ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-semibold">Wat je oefent</h2>
          <Link href="/oefeningen" className="link text-2xs">Alle oefeningen →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map((t) => (
            <div key={t.h} className="card card-pad hover:border-line-strong transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{t.icon}</span>
                <span className="text-2xs font-mono text-fg-dim">{t.h}</span>
                <span className="font-medium">{t.t}</span>
              </div>
              <p className="mt-1.5 text-2xs text-fg-muted font-mono">{t.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
