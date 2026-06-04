"use client";
import { useMemo, useState } from "react";
import Flashcard from "@/components/Flashcard";
import ITILQuiz from "@/components/ITILQuiz";
import { itilTopics, itilQuestions, itilSubtopics } from "@/lib/itil";

export default function ItilPage() {
  const topics = itilTopics();
  const questions = itilQuestions();
  const subtopics = itilSubtopics();

  const [mode, setMode] = useState<"leren" | "oefenen">("leren");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [sub, setSub] = useState("");

  const topic = topics.find((t) => t.id === topicId) ?? topics[0];
  const quizQs = useMemo(
    () => (sub ? questions.filter((q) => q.subtopic === sub) : questions),
    [questions, sub],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">🧭 ITIL 4</h1>
          <p className="text-2xs text-fg-dim">Leer de leidende principes &amp; kernconcepten — en oefen tot je ze kent.</p>
        </div>
        {/* Modus-schakelaar */}
        <div className="inline-flex h-9 p-0.5 border border-line rounded-md bg-pane">
          <button onClick={() => setMode("leren")}
            className={`px-3 rounded text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors ${mode === "leren" ? "bg-brand/15 text-brand" : "text-fg-muted hover:text-fg"}`}>
            📖 Leren
          </button>
          <button onClick={() => setMode("oefenen")}
            className={`px-3 rounded text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors ${mode === "oefenen" ? "bg-brand/15 text-brand" : "text-fg-muted hover:text-fg"}`}>
            🎯 Oefenen
          </button>
        </div>
      </div>

      {/* ─── LEREN ─────────────────────────────────────────────── */}
      {mode === "leren" && (
        topics.length === 0 ? (
          <div className="empty-state"><span className="text-3xl">📚</span><p>De leerkaarten worden geladen…</p></div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <button key={t.id} onClick={() => setTopicId(t.id)}
                  className={`chip ${topic?.id === t.id ? "chip-brand" : ""}`}>
                  <span>{t.icon}</span> {t.title}
                  <span className="text-fg-dim ml-1">{t.cards.length}</span>
                </button>
              ))}
            </div>

            {topic && (
              <div className="space-y-3">
                {topic.intro && <p className="text-[14px] text-fg-muted">{topic.intro}</p>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topic.cards.map((c, i) => <Flashcard key={i} card={c} />)}
                </div>
                <p className="text-2xs text-fg-dim text-center pt-1">💡 Klik op een kaart om het antwoord te zien.</p>
              </div>
            )}
          </>
        )
      )}

      {/* ─── OEFENEN ───────────────────────────────────────────── */}
      {mode === "oefenen" && (
        <div className="space-y-4">
          {subtopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setSub("")} className={`chip ${!sub ? "chip-brand" : ""}`}>Alles ({questions.length})</button>
              {subtopics.map((s) => (
                <button key={s} onClick={() => setSub(s)} className={`chip ${sub === s ? "chip-brand" : ""}`}>
                  {s} <span className="text-fg-dim ml-1">{questions.filter((q) => q.subtopic === s).length}</span>
                </button>
              ))}
            </div>
          )}
          <ITILQuiz key={sub || "all"} questions={quizQs} />
        </div>
      )}
    </div>
  );
}
