"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import {
  getExercises, chapters, DIFFICULTIES, type Difficulty, type Shell, type Exercise,
} from "@/lib/exercises";

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane",
};

function chapterNum(ch: string) {
  const m = /^H(\d+)/i.exec(ch);
  return m ? parseInt(m[1], 10) : 999;
}

export default function OefeningenPage() {
  return (
    <Suspense fallback={<div className="empty-state text-fg-dim">Laden…</div>}>
      <OefeningenInner />
    </Suspense>
  );
}

function OefeningenInner() {
  const sp = useSearchParams();
  const mounted = useMounted();
  const store = useProgress();

  const [q, setQ] = useState("");
  const [chapter, setChapter] = useState(sp.get("chapter") ?? "");
  const [diff, setDiff] = useState<Difficulty | "">("");
  const [shell, setShell] = useState<Shell | "">("");
  const [favOnly, setFavOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const all = getExercises();
  const chs = chapters();

  // Gefilterde lijst (zonder hoofdstuk-filter — dat doen we via de secties)
  const list = useMemo(() => {
    let l = all.slice();
    if (diff) l = l.filter((e) => e.difficulty === diff);
    if (shell) l = l.filter((e) => e.shell === shell);
    if (favOnly && mounted) l = l.filter((e) => store.favorites[e.id]);
    if (q.trim()) {
      const needle = q.toLowerCase();
      l = l.filter(
        (e) =>
          e.title.toLowerCase().includes(needle) ||
          e.prompt.toLowerCase().includes(needle) ||
          (e.tags ?? []).some((t) => t.includes(needle)),
      );
    }
    return l;
  }, [all, diff, shell, favOnly, q, mounted, store.favorites]);

  // Groeperen per hoofdstuk (in cursusvolgorde), eventueel beperkt tot 1 hoofdstuk
  const groups = useMemo(() => {
    const m = new Map<string, Exercise[]>();
    for (const e of list) {
      if (chapter && e.chapter !== chapter) continue;
      if (!m.has(e.chapter)) m.set(e.chapter, []);
      m.get(e.chapter)!.push(e);
    }
    return [...m.entries()].sort((a, b) => chapterNum(a[0]) - chapterNum(b[0]) || a[0].localeCompare(b[0]));
  }, [list, chapter]);

  const totalShown = groups.reduce((n, [, items]) => n + items.length, 0);
  const solvedCount = (items: Exercise[]) => (mounted ? items.filter((e) => store.solved[e.id]).length : 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Oefeningen</h1>
          <p className="text-2xs text-fg-dim">
            {totalShown} oefening{totalShown === 1 ? "" : "en"} in {groups.length} hoofdstuk{groups.length === 1 ? "" : "ken"}
          </p>
        </div>
      </div>

      {/* ─── FILTERS ───────────────────────────────────────────── */}
      <div className="card card-pad flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs flex-1 min-w-[180px]"
          placeholder="Zoek op titel, opdracht of tag…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-auto" value={diff} onChange={(e) => setDiff(e.target.value as Difficulty | "")}>
          <option value="">Alle niveaus</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFF_LABEL[d]}</option>)}
        </select>
        <select className="input w-auto" value={shell} onChange={(e) => setShell(e.target.value as Shell | "")}>
          <option value="">PowerShell + CMD</option>
          <option value="powershell">PowerShell</option>
          <option value="cmd">CMD</option>
        </select>
        <button
          className={`btn ${favOnly ? "border-brand text-brand" : ""}`}
          onClick={() => setFavOnly((v) => !v)}
        >
          ⭐ Favorieten
        </button>
        {(chapter || diff || shell || favOnly || q) && (
          <button className="btn-ghost" onClick={() => { setQ(""); setChapter(""); setDiff(""); setShell(""); setFavOnly(false); }}>
            Wissen
          </button>
        )}
      </div>

      {/* ─── HOOFDSTUK-OVERZICHT (klik = filter) ───────────────── */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setChapter("")} className={`chip ${!chapter ? "chip-brand" : ""}`}>
          Alle hoofdstukken
        </button>
        {chs.map((c) => {
          const items = all.filter((e) => e.chapter === c);
          const done = solvedCount(items);
          return (
            <button
              key={c}
              onClick={() => setChapter(chapter === c ? "" : c)}
              className={`chip ${chapter === c ? "chip-brand" : ""}`}
              title={`${done}/${items.length} opgelost`}
            >
              {c}
              <span className="text-fg-dim ml-1">{mounted ? `${done}/${items.length}` : items.length}</span>
            </button>
          );
        })}
      </div>

      {/* ─── SECTIES PER HOOFDSTUK ─────────────────────────────── */}
      {groups.length === 0 ? (
        <div className="empty-state">
          <span className="text-3xl">🔍</span>
          <p>Geen oefeningen gevonden met deze filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([ch, items]) => {
            const done = solvedCount(items);
            const isCollapsed = collapsed[ch];
            return (
              <section key={ch}>
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [ch]: !c[ch] }))}
                  className="w-full flex items-center gap-3 mb-3 group text-left"
                >
                  <span className={`text-fg-dim transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▸</span>
                  <h2 className="text-[15px] font-semibold group-hover:text-brand transition-colors">{ch}</h2>
                  <span className="text-2xs text-fg-muted font-mono">{mounted ? `${done}/${items.length}` : items.length}</span>
                  <div className="flex-1 max-w-[180px] progress-track ml-1">
                    <div className="progress-fill" style={{ width: `${items.length ? Math.round((done / items.length) * 100) : 0}%` }} />
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((e) => <ExerciseCard key={e.id} ex={e} mounted={mounted} />)}
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

function ExerciseCard({ ex, mounted }: { ex: Exercise; mounted: boolean }) {
  const store = useProgress();
  const solved = mounted && !!store.solved[ex.id];
  const fav = mounted && !!store.favorites[ex.id];

  return (
    <Link
      href={`/oefeningen/${ex.id}`}
      className={`card card-pad block hover:border-line-strong hover:shadow-fluent-md transition-all group relative ${solved ? "ring-1 ring-ok/45 bg-ok/[0.05]" : ""}`}
    >
      <button
        onClick={(ev) => { ev.preventDefault(); store.toggleFavorite(ex.id); }}
        className={`absolute top-2.5 right-2.5 text-sm transition-colors ${fav ? "" : "opacity-30 hover:opacity-70"}`}
        title={fav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
        aria-label="Favoriet"
      >
        {fav ? "⭐" : "☆"}
      </button>

      <h3 className="font-medium pr-6 group-hover:text-brand transition-colors">{ex.title}</h3>
      <p className="mt-1 text-2xs text-fg-muted line-clamp-2">{ex.prompt}</p>

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {solved && <span className="chip-ok">✓ Opgelost</span>}
        <span className={`diff-${ex.difficulty}`}>{DIFF_LABEL[ex.difficulty]}</span>
        <span className={`shell-badge shell-${ex.shell}`}>{ex.shell === "powershell" ? "⌨ PowerShell" : "⬛ CMD"}</span>
        {ex.type === "script" && <span className="chip">script</span>}
        <span className={`xp-chip ml-auto ${ex.difficulty}`}>+{ex.difficulty === "insane" ? 0 : 25} XP</span>
      </div>
    </Link>
  );
}
