"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { getCmdlets, cmdletChapters } from "@/lib/cmdlets";

function chapterNum(ch: string) {
  const m = /^H(\d+)/i.exec(ch);
  return m ? parseInt(m[1], 10) : 999;
}

export default function CmdletsPage() {
  const all = getCmdlets();
  const [q, setQ] = useState("");
  const [chapter, setChapter] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const list = useMemo(() => {
    if (!q.trim()) return all;
    const n = q.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(n) ||
        (c.summary ?? "").toLowerCase().includes(n) ||
        (c.aliases ?? []).some((a) => a.toLowerCase().includes(n)),
    );
  }, [all, q]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof all>();
    for (const c of list) {
      const ch = c.chapter || "Overig";
      if (chapter && ch !== chapter) continue;
      if (!m.has(ch)) m.set(ch, []);
      m.get(ch)!.push(c);
    }
    return [...m.entries()].sort((a, b) => chapterNum(a[0]) - chapterNum(b[0]) || a[0].localeCompare(b[0]));
  }, [list, chapter]);

  const chapters = cmdletChapters();
  const shown = groups.reduce((n, [, items]) => n + items.length, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Cmdlet-bibliotheek</h1>
        <p className="text-2xs text-fg-dim">{shown} cmdlets · gegroepeerd per hoofdstuk · klik er een aan voor parameters &amp; voorbeelden</p>
      </div>

      <div className="card card-pad flex flex-wrap items-center gap-2">
        <input className="input max-w-xs flex-1 min-w-[180px]" placeholder="Zoek een cmdlet of alias…" value={q} onChange={(e) => setQ(e.target.value)} />
        {(q || chapter) && <button className="btn-ghost" onClick={() => { setQ(""); setChapter(""); }}>Wissen</button>}
      </div>

      {/* Hoofdstuk-overzicht */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setChapter("")} className={`chip ${!chapter ? "chip-brand" : ""}`}>Alle hoofdstukken</button>
        {chapters.map((c) => (
          <button key={c} onClick={() => setChapter(chapter === c ? "" : c)} className={`chip ${chapter === c ? "chip-brand" : ""}`}>
            {c}<span className="text-fg-dim ml-1">{all.filter((x) => x.chapter === c).length}</span>
          </button>
        ))}
      </div>

      {all.length === 0 ? (
        <div className="empty-state"><span className="text-3xl">📖</span><p>De cmdlet-bibliotheek wordt gevuld vanuit je cursus.</p></div>
      ) : groups.length === 0 ? (
        <div className="empty-state"><span className="text-3xl">🔍</span><p>Geen cmdlets gevonden.</p></div>
      ) : (
        <div className="space-y-6">
          {groups.map(([ch, items]) => {
            const isCollapsed = collapsed[ch];
            return (
              <section key={ch}>
                <button onClick={() => setCollapsed((c) => ({ ...c, [ch]: !c[ch] }))} className="w-full flex items-center gap-3 mb-3 group text-left">
                  <span className={`text-fg-dim transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▸</span>
                  <h2 className="text-[15px] font-semibold group-hover:text-brand transition-colors">{ch}</h2>
                  <span className="text-2xs text-fg-muted font-mono">{items.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((c) => (
                      <Link key={c.name} href={`/cmdlets/${encodeURIComponent(c.name)}`} className="card card-pad block hover:border-line-strong hover:shadow-fluent-md transition-all group">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-semibold text-brand group-hover:underline truncate">{c.name}</code>
                          {c.aliases && c.aliases.length > 0 && <span className="text-2xs text-fg-dim font-mono shrink-0">{c.aliases.join(", ")}</span>}
                        </div>
                        <p className="mt-1 text-2xs text-fg-muted line-clamp-2">{c.summary}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
