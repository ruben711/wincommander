"use client";
import { useMemo, useState } from "react";
import TheorieQuiz from "@/components/TheorieQuiz";
import { getTheory, theoryChapters } from "@/lib/theorie";

export default function TheoriePage() {
  const all = getTheory();
  const chapters = theoryChapters();
  const [chapter, setChapter] = useState(chapters[0] ?? "");
  const [subtopic, setSubtopic] = useState("");

  const subtopics = useMemo(() => {
    const s = new Set<string>();
    for (const q of all) if (q.chapter === chapter && q.subtopic) s.add(q.subtopic);
    return [...s];
  }, [all, chapter]);

  const items = useMemo(
    () => all.filter((q) => q.chapter === chapter && (!subtopic || q.subtopic === subtopic)),
    [all, chapter, subtopic],
  );

  if (all.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-4">Theorie</h1>
        <div className="empty-state"><span className="text-3xl">🎓</span><p>De theorie wordt gevuld vanuit je cursus.</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Theorie</h1>
        <p className="text-2xs text-fg-dim">Oefen-toetsen in study-mode — directe feedback, geen XP.</p>
      </div>

      {/* Hoofdstuk-keuze */}
      <div className="flex flex-wrap gap-2">
        {chapters.map((c) => (
          <button
            key={c}
            onClick={() => { setChapter(c); setSubtopic(""); }}
            className={`btn ${chapter === c ? "border-brand text-brand bg-brand/10" : ""}`}
          >
            {c}
            <span className="ml-1.5 text-2xs text-fg-dim">{all.filter((q) => q.chapter === c).length}</span>
          </button>
        ))}
      </div>

      {/* Subtopic-filter (bv. ITIL) */}
      {subtopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSubtopic("")} className={`chip ${!subtopic ? "chip-brand" : ""}`}>Alles</button>
          {subtopics.map((s) => (
            <button key={s} onClick={() => setSubtopic(s)} className={`chip ${subtopic === s ? "chip-brand" : ""}`}>{s}</button>
          ))}
        </div>
      )}

      <TheorieQuiz key={`${chapter}-${subtopic}`} items={items} />
    </div>
  );
}
