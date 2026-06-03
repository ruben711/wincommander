"use client";
import { useMemo, useState } from "react";
import type { TheoryQ } from "@/lib/theorie";

export default function TheorieQuiz({ items }: { items: TheoryQ[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const mcItems = useMemo(() => items.map((q, i) => ({ q, i })).filter((x) => x.q.type === "mc"), [items]);
  const score = mcItems.filter(({ q, i }) => revealed[i] && selected[i] === q.answer).length;
  const answered = mcItems.filter(({ i }) => revealed[i]).length;

  function reveal(i: number) { setRevealed((r) => ({ ...r, [i]: true })); }
  function reset() { setSelected({}); setRevealed({}); }

  if (items.length === 0) {
    return <div className="empty-state"><span className="text-3xl">🎓</span><p>Nog geen vragen voor dit onderdeel.</p></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-2xs text-fg-muted">
        <span>{items.length} vra{items.length === 1 ? "ag" : "gen"} · study-mode (geen XP)</span>
        <span className="flex items-center gap-3">
          {mcItems.length > 0 && <span className="font-mono">Score: {score}/{mcItems.length} {answered > 0 && `(${answered} beantwoord)`}</span>}
          {answered > 0 && <button className="btn-ghost btn-sm" onClick={reset}>Opnieuw</button>}
        </span>
      </div>

      {items.map((q, i) => {
        const isOpen = q.type === "open";
        const isRevealed = !!revealed[i];
        return (
          <div key={i} className="card card-pad">
            <div className="flex items-start gap-2">
              <span className="text-fg-dim font-mono text-2xs mt-1">{i + 1}.</span>
              <div className="flex-1">
                {q.subtopic && <span className="chip mb-2">{q.subtopic}</span>}
                <p className="font-medium">{q.question}</p>

                {!isOpen && q.choices && (
                  <div className="mt-3 space-y-1.5">
                    {q.choices.map((choice) => {
                      const chosen = selected[i] === choice;
                      const correct = choice === q.answer;
                      let cls = "border-line bg-pane hover:bg-hover";
                      if (isRevealed) {
                        if (correct) cls = "border-ok/60 bg-ok/10 text-ok";
                        else if (chosen) cls = "border-err/60 bg-err/10 text-err";
                        else cls = "border-line opacity-60";
                      } else if (chosen) cls = "border-brand bg-brand/10 text-brand";
                      return (
                        <button
                          key={choice}
                          disabled={isRevealed}
                          onClick={() => setSelected((s) => ({ ...s, [i]: choice }))}
                          className={`w-full text-left px-3 py-2 rounded-md border text-[13px] transition-colors flex items-center gap-2 ${cls}`}
                        >
                          {isRevealed && correct && <span>✓</span>}
                          {isRevealed && chosen && !correct && <span>✗</span>}
                          <span>{choice}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isOpen && (
                  <textarea className="input mt-3 h-auto py-2" rows={2} placeholder="Typ je antwoord (zelf-evaluatie)…" disabled={isRevealed} />
                )}

                <div className="mt-3 flex items-center gap-2">
                  {!isRevealed ? (
                    <button className="btn btn-sm" disabled={!isOpen && !selected[i]} onClick={() => reveal(i)}>
                      {isOpen ? "Toon modelantwoord" : "Controleer"}
                    </button>
                  ) : (
                    <span className={!isOpen ? (selected[i] === q.answer ? "chip-ok" : "chip-err") : "chip"}>
                      {isOpen ? "Modelantwoord" : selected[i] === q.answer ? "Juist!" : "Fout"}
                    </span>
                  )}
                </div>

                {isRevealed && (
                  <div className="mt-3 feedback-info">
                    {isOpen && <p className="font-medium mb-1">{q.answer}</p>}
                    {q.explanation && <p className="text-fg-muted">{q.explanation}</p>}
                    {!q.explanation && !isOpen && <p>Juiste antwoord: <strong>{q.answer}</strong></p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
