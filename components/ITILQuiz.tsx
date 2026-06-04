"use client";
import { useState } from "react";
import type { TheoryQ } from "@/lib/theorie";

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function ITILQuiz({ questions }: { questions: TheoryQ[] }) {
  const [order, setOrder] = useState(() => shuffle(questions.map((_, i) => i)));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selfMark, setSelfMark] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return <div className="empty-state"><span className="text-3xl">🎓</span><p>Geen vragen voor dit onderdeel.</p></div>;
  }

  const total = order.length;
  const q = questions[order[idx]];
  const isOpen = q.type === "open";

  function bump(ok: boolean) {
    if (ok) { setScore((s) => s + 1); setStreak((s) => { const n = s + 1; setBest((b) => Math.max(b, n)); return n; }); }
    else setStreak(0);
  }
  function check() {
    setRevealed(true);
    if (!isOpen) bump(selected === q.answer);
  }
  function selfAssess(ok: boolean) { setSelfMark(ok); bump(ok); }
  function next() {
    if (idx + 1 >= total) { setDone(true); return; }
    setIdx((i) => i + 1); setSelected(null); setRevealed(false); setSelfMark(null);
  }
  function restart() {
    setOrder(shuffle(questions.map((_, i) => i)));
    setIdx(0); setSelected(null); setRevealed(false); setSelfMark(null); setScore(0); setStreak(0); setBest(0); setDone(false);
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "👍" : "💪";
    return (
      <div className="card card-pad text-center space-y-3">
        <div className="text-5xl">{emoji}</div>
        <div className="text-3xl font-bold" style={{ color: pct >= 50 ? "rgb(var(--ok))" : "rgb(var(--warn))" }}>{score}/{total}</div>
        <div className="text-fg-muted">{pct}% correct · langste reeks: {best} 🔥</div>
        <button className="btn-primary mx-auto" onClick={restart}>Opnieuw oefenen</button>
      </div>
    );
  }

  const answered = revealed && (!isOpen || selfMark !== null);

  return (
    <div className="space-y-4">
      {/* statusbalk */}
      <div className="flex items-center gap-3 text-2xs text-fg-muted">
        <span className="font-mono">Vraag {idx + 1}/{total}</span>
        <div className="flex-1 progress-track"><div className="progress-fill" style={{ width: `${(idx / total) * 100}%` }} /></div>
        <span className="chip-ok">{score} ✓</span>
        {streak >= 2 && <span className="chip-brand">{streak} 🔥</span>}
      </div>

      <div className="card card-pad">
        {q.subtopic && <span className="chip mb-2">{q.subtopic}</span>}
        <p className="font-medium text-[15px]">{q.question}</p>

        {!isOpen && q.choices && (
          <div className="mt-3 space-y-1.5">
            {q.choices.map((choice) => {
              const chosen = selected === choice; const correct = choice === q.answer;
              let cls = "border-line bg-pane hover:bg-hover";
              if (revealed) {
                if (correct) cls = "border-ok/60 bg-ok/10 text-ok";
                else if (chosen) cls = "border-err/60 bg-err/10 text-err";
                else cls = "border-line opacity-60";
              } else if (chosen) cls = "border-brand bg-brand/10 text-brand";
              return (
                <button key={choice} disabled={revealed} onClick={() => setSelected(choice)}
                  className={`w-full text-left px-3 py-2 rounded-md border text-[13px] transition-colors flex items-center gap-2 ${cls}`}>
                  {revealed && correct && <span>✓</span>}{revealed && chosen && !correct && <span>✗</span>}
                  <span>{choice}</span>
                </button>
              );
            })}
          </div>
        )}

        {isOpen && (
          <textarea className="input mt-3 h-auto py-2" rows={2} placeholder="Typ je antwoord…" disabled={revealed} />
        )}

        {revealed && (
          <div className="mt-3 feedback-info">
            {isOpen && <p className="font-medium mb-1">Modelantwoord: {q.answer}</p>}
            {q.explanation && <p className="text-fg-muted">{q.explanation}</p>}
            {!q.explanation && !isOpen && <p>Juist: <strong>{q.answer}</strong></p>}
            {isOpen && selfMark === null && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xs text-fg-muted">Had je het juist?</span>
                <button className="btn btn-sm" onClick={() => selfAssess(true)}>✓ Ja</button>
                <button className="btn btn-sm" onClick={() => selfAssess(false)}>✗ Nee</button>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          {!revealed
            ? <button className="btn-primary" disabled={!isOpen && !selected} onClick={check}>Controleer</button>
            : answered && <button className="btn-primary" onClick={next}>{idx + 1 >= total ? "Bekijk resultaat" : "Volgende →"}</button>}
        </div>
      </div>
    </div>
  );
}
