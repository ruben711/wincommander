"use client";
import Link from "next/link";
import ExerciseRunner from "@/components/ExerciseRunner";
import { getExercise, nextExercise, prevExercise, type Difficulty } from "@/lib/exercises";

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane",
};

export default function ExercisePage({ params }: { params: { id: string } }) {
  const ex = getExercise(params.id);

  if (!ex) {
    return (
      <div className="empty-state">
        <span className="text-3xl">🤷</span>
        <p>Oefening <code className="font-mono">{params.id}</code> niet gevonden.</p>
        <Link href="/oefeningen" className="btn mt-2">Terug naar oefeningen</Link>
      </div>
    );
  }

  const prev = prevExercise(ex.id);
  const next = nextExercise(ex.id);
  const runnable = ex.type !== "predict";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="text-2xs text-fg-dim">
        <Link href="/oefeningen" className="hover:text-brand">Oefeningen</Link>
        <span className="mx-1.5">/</span>
        <span>{ex.chapter}</span>
      </div>

      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`diff-${ex.difficulty}`}>{DIFF_LABEL[ex.difficulty]}</span>
          <span className={`shell-badge shell-${ex.shell}`}>{ex.shell === "powershell" ? "⌨ PowerShell" : "⬛ CMD"}</span>
          {(ex.tags ?? []).map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
        <h1 className="text-xl font-semibold">{ex.title}</h1>
        {!(ex.steps && ex.steps.length) && (
          <p className="mt-2 text-[15px] text-fg-muted leading-relaxed">{ex.prompt}</p>
        )}
      </div>

      {runnable ? (
        <ExerciseRunner exercise={ex} />
      ) : (
        <div className="feedback-info">Dit oefening-type (voorspel de uitvoer) krijgt binnenkort een eigen weergave.</div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-line">
        {prev ? <Link href={`/oefeningen/${prev.id}`} className="btn">← {prev.title}</Link> : <span />}
        {next ? <Link href={`/oefeningen/${next.id}`} className="btn">{next.title} →</Link> : <span />}
      </div>
    </div>
  );
}
