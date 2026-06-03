"use client";
import Link from "next/link";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { getExercises, getExercise, byChapter, DIFFICULTIES, type Difficulty } from "@/lib/exercises";

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane",
};

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export default function Dashboard() {
  const mounted = useMounted();
  const store = useProgress();
  const all = getExercises();

  if (!mounted) {
    return <div className="empty-state"><span className="text-fg-dim">Laden…</span></div>;
  }

  const lvl = store.level();
  const solvedIds = Object.keys(store.solved);
  const nSolved = solvedIds.length;
  const badges = store.badges();
  const chapters = byChapter();

  const diffStats = DIFFICULTIES.map((d) => {
    const items = all.filter((e) => e.difficulty === d);
    const done = items.filter((e) => store.solved[e.id]).length;
    return { d, done, total: items.length };
  });

  const recent = store.attempts.slice(0, 8);

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-2xs text-fg-dim">Je voortgang wordt lokaal in je browser bewaard.</p>
        </div>
        {nSolved > 0 && (
          <button
            className="btn-ghost text-2xs"
            onClick={() => { if (confirm("Alle voortgang wissen? Dit kan niet ongedaan gemaakt worden.")) store.reset(); }}
          >
            Voortgang resetten
          </button>
        )}
      </div>

      {/* ─── LEVEL + STATS ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Level-kaart */}
        <div className="card card-pad lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-lg bg-brand/15 text-brand text-xl font-bold font-mono">
              {lvl.level}
            </div>
            <div>
              <div className="text-2xs text-fg-dim uppercase tracking-wider">Level</div>
              <div className="text-lg font-semibold">{store.xp} XP</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-2xs text-fg-muted mb-1">
              <span>Level {lvl.level}</span>
              <span>{store.xp - lvl.prevAt} / {lvl.nextAt - lvl.prevAt} XP</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Stat-tegels */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Opgelost" value={`${nSolved}`} sub={`van ${all.length}`} />
          <Stat label="Streak" value={`${store.streakDays}`} sub="dagen 🔥" />
          <Stat label="Badges" value={`${badges.length}`} sub="verdiend" />
          <Stat label="Pogingen" value={`${store.attempts.length}`} sub="totaal" />
        </div>
      </div>

      {/* ─── VOORTGANG PER MOEILIJKHEID ────────────────────────── */}
      <section className="card card-pad">
        <h2 className="section-title mb-3">Voortgang per moeilijkheid</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {diffStats.map(({ d, done, total }) => (
            <div key={d}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`diff-${d}`}><span className={`diff-dot ${d}`} /> {DIFF_LABEL[d]}</span>
                <span className="text-2xs text-fg-muted font-mono">{done}/{total}</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${pct(done, total)}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VOORTGANG PER HOOFDSTUK ───────────────────────────── */}
      <section className="card card-pad">
        <h2 className="section-title mb-3">Voortgang per hoofdstuk</h2>
        {chapters.length === 0 ? (
          <p className="text-2xs text-fg-dim">Nog geen oefeningen geladen.</p>
        ) : (
          <div className="space-y-3">
            {chapters.map(({ chapter, items }) => {
              const done = items.filter((e) => store.solved[e.id]).length;
              return (
                <div key={chapter} className="flex items-center gap-3">
                  <Link href={`/oefeningen?chapter=${encodeURIComponent(chapter)}`} className="w-44 shrink-0 text-[13px] hover:text-brand truncate">
                    {chapter}
                  </Link>
                  <div className="flex-1 progress-track"><div className="progress-fill" style={{ width: `${pct(done, items.length)}%` }} /></div>
                  <span className="w-12 text-right text-2xs text-fg-muted font-mono">{done}/{items.length}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── BADGES + RECENT ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="card card-pad">
          <h2 className="section-title mb-3">Badges</h2>
          {badges.length === 0 ? (
            <p className="text-2xs text-fg-dim">Los je eerste oefening op om badges te verdienen. 🎯</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => <span key={b} className="chip">{b}</span>)}
            </div>
          )}
        </section>

        <section className="card card-pad">
          <h2 className="section-title mb-3">Recente activiteit</h2>
          {recent.length === 0 ? (
            <p className="text-2xs text-fg-dim">Nog geen pogingen. Begin bij <Link href="/oefeningen" className="link">de oefeningen</Link>.</p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((a, i) => {
                const ex = getExercise(a.exerciseId);
                return (
                  <li key={i} className="flex items-center gap-2 text-[13px]">
                    <span className={a.correct ? "text-ok" : "text-err"}>{a.correct ? "✓" : "✗"}</span>
                    <Link href={`/oefeningen/${a.exerciseId}`} className="hover:text-brand truncate">
                      {ex?.title ?? a.exerciseId}
                    </Link>
                    <code className="ml-auto text-2xs text-fg-dim font-mono truncate max-w-[40%]">{a.command}</code>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card card-pad">
      <div className="text-2xs text-fg-dim uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-semibold mt-0.5">{value}</div>
      <div className="text-2xs text-fg-muted">{sub}</div>
    </div>
  );
}
