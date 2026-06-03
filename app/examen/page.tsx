"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getExercises, chapters as allChapters, type Exercise, type Difficulty } from "@/lib/exercises";
import { gradeExercise } from "@/lib/winGrader";

const DIFF_LABEL: Record<Difficulty, string> = { easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane" };
type Phase = "config" | "running" | "done";

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
function fmt(s: number) { const m = Math.floor(s / 60); const ss = s % 60; return `${m}:${ss.toString().padStart(2, "0")}`; }

export default function ExamenPage() {
  const pool = useMemo(() => getExercises().filter((e) => e.type !== "multi-step" && (e.acceptors?.length || e.mustInclude?.length)), []);
  const [phase, setPhase] = useState<Phase>("config");
  const [count, setCount] = useState(10);
  const [chapter, setChapter] = useState("");
  const [qs, setQs] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [startTs, setStartTs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [endTs, setEndTs] = useState(0);

  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTs) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase, startTs]);

  function start() {
    let p = pool;
    if (chapter) p = p.filter((e) => e.chapter === chapter);
    const picked = shuffle(p).slice(0, Math.min(count, p.length));
    setQs(picked); setAnswers({}); setIdx(0); setStartTs(Date.now()); setElapsed(0); setPhase("running");
  }
  function finish() { setEndTs(Date.now()); setPhase("done"); }

  const graded = useMemo(
    () => (phase === "done" ? qs.map((e) => ({ ex: e, answer: answers[e.id] ?? "", res: gradeExercise(answers[e.id] ?? "", e) })) : []),
    [phase, qs, answers],
  );
  const score = graded.filter((g) => g.res.correct).length;

  // ── CONFIG ──
  if (phase === "config") {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div><h1 className="text-xl font-semibold">Examensimulatie</h1>
          <p className="text-2xs text-fg-dim">Willekeurige opdrachten met timer. Score &amp; modeloplossingen achteraf.</p></div>
        <div className="card card-pad space-y-4">
          <div>
            <label className="section-title">Aantal vragen</label>
            <div className="flex gap-2 mt-2">
              {[5, 10, 15, 20].map((n) => (
                <button key={n} onClick={() => setCount(n)} className={`btn ${count === n ? "border-brand text-brand bg-brand/10" : ""}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="section-title">Hoofdstuk (optioneel)</label>
            <select className="input mt-2" value={chapter} onChange={(e) => setChapter(e.target.value)}>
              <option value="">Alle hoofdstukken</option>
              {allChapters().map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="text-2xs text-fg-dim">{pool.length} oefeningen beschikbaar in de examenpool.</div>
          <button className="btn-primary w-full h-10" onClick={start} disabled={pool.length === 0}>▸ Start examen</button>
        </div>
      </div>
    );
  }

  // ── RUNNING ──
  if (phase === "running") {
    const ex = qs[idx];
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-2xs text-fg-muted">Vraag {idx + 1}/{qs.length}</span>
          <span className="chip-brand font-mono">⏱ {fmt(elapsed)}</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${((idx + 1) / qs.length) * 100}%` }} /></div>

        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-2">
            <span className={`diff-${ex.difficulty}`}>{DIFF_LABEL[ex.difficulty]}</span>
            <span className="text-2xs text-fg-dim">{ex.chapter}</span>
          </div>
          <p className="text-[15px]">{ex.prompt}</p>
          <textarea
            className="input font-mono mt-3 h-auto py-2"
            rows={ex.type === "script" ? 6 : 2}
            placeholder={ex.shell === "cmd" ? "CMD-commando…" : "PowerShell-commando of -script…"}
            value={answers[ex.id] ?? ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [ex.id]: e.target.value }))}
            spellCheck={false}
          />
        </div>

        <div className="flex items-center justify-between">
          <button className="btn" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>← Vorige</button>
          {idx < qs.length - 1
            ? <button className="btn" onClick={() => setIdx((i) => i + 1)}>Volgende →</button>
            : <button className="btn-primary" onClick={finish}>Indienen ✓</button>}
        </div>
        <button className="btn-ghost btn-sm" onClick={finish}>Vroegtijdig indienen</button>
      </div>
    );
  }

  // ── DONE ──
  const totalTime = Math.floor((endTs - startTs) / 1000);
  const pct = qs.length ? Math.round((score / qs.length) * 100) : 0;
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="card card-pad text-center">
        <div className="text-2xs text-fg-dim uppercase tracking-wider">Resultaat</div>
        <div className="text-4xl font-bold mt-1" style={{ color: pct >= 50 ? "rgb(var(--ok))" : "rgb(var(--err))" }}>{score}/{qs.length}</div>
        <div className="text-fg-muted mt-1">{pct}% correct · ⏱ {fmt(totalTime)}</div>
        <div className="flex gap-2 justify-center mt-4">
          <button className="btn-primary" onClick={() => setPhase("config")}>Nieuw examen</button>
        </div>
      </div>

      <div className="space-y-3">
        {graded.map(({ ex, answer, res }, i) => (
          <div key={ex.id} className="card card-pad">
            <div className="flex items-start gap-2">
              <span className={res.correct ? "text-ok" : "text-err"}>{res.correct ? "✓" : "✗"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-2xs text-fg-dim">{i + 1}.</span>
                  <span className={`diff-${ex.difficulty}`}>{DIFF_LABEL[ex.difficulty]}</span>
                  <Link href={`/oefeningen/${ex.id}`} className="text-2xs link ml-auto">oefenen →</Link>
                </div>
                <p className="text-[14px]">{ex.prompt}</p>
                <div className="mt-2 text-2xs text-fg-muted">Jouw antwoord:</div>
                <pre className="code mt-1">{answer || "(leeg)"}</pre>
                {!res.correct && (
                  <>
                    <div className="mt-2 text-2xs text-fg-muted">Modeloplossing:</div>
                    <pre className="code mt-1">{ex.solution}</pre>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
