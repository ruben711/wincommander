"use client";
import { useMemo, useState } from "react";
import MockTerminal, { type RunResult } from "./MockTerminal";
import XpToast from "./XpToast";
import { gradeCommand } from "@/lib/winGrader";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import type { Exercise, Step } from "@/lib/exercises";

type Stage = {
  prompt: string;
  acceptors?: string[];
  mustInclude?: string[];
  forbid?: string[];
  outputMock?: string[];
  solution: string;
  hints?: string[];
};

function isHelp(cmd: string) {
  const m = cmd.trim().toLowerCase();
  return m === "help" || m.startsWith("help ") || m.startsWith("get-help") || m.startsWith("man ") || /\s-\?$/.test(cmd);
}

export default function ExerciseRunner({ exercise: ex }: { exercise: Exercise }) {
  const mounted = useMounted();
  const store = useProgress();

  const stages: Stage[] = useMemo(
    () =>
      ex.steps && ex.steps.length
        ? ex.steps.map((s: Step) => ({ ...s }))
        : [{
            prompt: ex.prompt, acceptors: ex.acceptors, mustInclude: ex.mustInclude,
            forbid: ex.forbid, outputMock: ex.outputMock, solution: ex.solution ?? "", hints: ex.hints,
          }],
    [ex],
  );
  const isMulti = !!(ex.steps && ex.steps.length);

  const [stageIndex, setStageIndex] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [xp, setXp] = useState<{ amount: number; t: number }>({ amount: 0, t: 0 });

  const stage = stages[stageIndex];
  const solved = mounted && !!store.solved[ex.id];
  const fav = mounted && !!store.favorites[ex.id];
  const note = mounted ? store.getNote(ex.id) : "";
  const saved = mounted ? store.getSavedCommand(ex.id) : null;
  const initialInput = saved ?? ex.starter ?? "";

  async function onRun(command: string): Promise<RunResult> {
    if (isHelp(command)) {
      const target = command.trim().split(/\s+/)[1]?.replace(/^-/, "") ?? "";
      return {
        status: "info",
        output: [
          "",
          target ? `Hulp voor '${target}':` : "Get-Help",
          "Uitgebreide help met voorbeelden vind je in de Cmdlet-bibliotheek.",
          "Vastgelopen? Vraag hieronder een hint. 💡",
          "",
        ],
      };
    }

    const res = gradeCommand(command, {
      acceptors: stage.acceptors, shell: ex.shell,
      mustInclude: stage.mustInclude, forbid: stage.forbid,
      acceptRegex: (ex as any).acceptRegex,
    });

    if (res.correct) {
      setHintLevel(0);
      const isLast = stageIndex >= stages.length - 1;
      if (isLast) {
        const gained = store.recordAttempt({ exerciseId: ex.id, correct: true, command, difficulty: ex.difficulty });
        if (gained > 0) setXp({ amount: gained, t: Date.now() });
        setFeedback({ ok: true, msg: isMulti ? "Alle stappen voltooid! 🎉" : "Correct! 🎉" });
      } else {
        setFeedback({ ok: true, msg: `Stap ${stageIndex + 1} klopt — door naar stap ${stageIndex + 2}.` });
        setStageIndex((i) => i + 1);
      }
      return { output: stage.outputMock ?? [], status: undefined };
    }

    // fout
    store.recordAttempt({ exerciseId: ex.id, correct: false, command, difficulty: ex.difficulty });
    const msg = res.feedback ?? "Dat is nog niet het verwachte resultaat.";
    setFeedback({ ok: false, msg });
    return { output: [`✗ ${msg}`], status: "error" };
  }

  const greeting = useMemo(
    () => [
      "Windows PowerShell",
      "Copyright (C) Microsoft Corporation. Alle rechten voorbehouden.",
      "",
      "Typ je commando en druk op Enter. (Tab = aanvullen · ↑↓ = geschiedenis · Ctrl+L = wissen)",
      "",
    ],
    [],
  );

  if (!mounted) {
    return <div className="terminal"><div className="terminal-body term-dim">Terminal laden…</div></div>;
  }

  return (
    <div className="space-y-4">
      <XpToast amount={xp.amount} trigger={xp.t} />

      {/* Multi-step tracker + huidige stap */}
      {isMulti && (
        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-2">
            {stages.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`step-pill ${i < stageIndex || solved ? "done" : i === stageIndex ? "current" : ""}`}>
                  {i < stageIndex || solved ? "✓" : i + 1}
                </span>
                {i < stages.length - 1 && <span className="w-5 h-px bg-line" />}
              </div>
            ))}
            <span className="ml-2 text-2xs text-fg-muted">Stap {Math.min(stageIndex + 1, stages.length)}/{stages.length}</span>
          </div>
          <p className="text-[14px]">{stage.prompt}</p>
        </div>
      )}

      {ex.type === "script" && (
        <div className="feedback-info text-2xs">
          📝 Meerregelig script: <span className="kbd">Shift</span>+<span className="kbd">Enter</span> = nieuwe regel,{" "}
          <span className="kbd">Enter</span> = uitvoeren. Je wordt beoordeeld op de essentiële onderdelen (niet op exacte tekst).
        </div>
      )}

      {/* De terminal */}
      <MockTerminal
        key={ex.id}
        shell={ex.shell}
        admin={(ex as any).admin}
        greeting={greeting}
        initialInput={initialInput}
        placeholder={ex.shell === "cmd" ? "bv. dir" : "bv. Get-Service"}
        onRun={onRun}
        onChange={(v) => store.setSavedCommand(ex.id, v)}
      />

      {/* Feedback */}
      {feedback && (
        <div className={feedback.ok ? "feedback-ok" : "feedback-err"}>
          {feedback.ok ? "✓ " : "✗ "}{feedback.msg}
          {solved && feedback.ok && <span className="ml-2 chip-ok">opgelost</span>}
        </div>
      )}

      {/* Acties: hint / oplossing / favoriet / reset */}
      <div className="flex items-center gap-2 flex-wrap">
        {(stage.hints?.length ?? 0) > 0 && hintLevel < (stage.hints?.length ?? 0) && (
          <button className="btn btn-sm" onClick={() => setHintLevel((c) => c + 1)}>
            💡 Hint ({hintLevel}/{stage.hints!.length})
          </button>
        )}
        <button className="btn btn-sm" onClick={() => setShowSolution((s) => !s)}>
          {showSolution ? "Verberg oplossing" : "Toon oplossing"}
        </button>
        <button
          className={`btn btn-sm ${fav ? "border-brand text-brand" : ""}`}
          onClick={() => store.toggleFavorite(ex.id)}
        >
          {fav ? "⭐ Favoriet" : "☆ Favoriet"}
        </button>
        {solved && (
          <button className="btn-ghost btn-sm ml-auto" onClick={() => { store.resetExercise(ex.id); setStageIndex(0); setFeedback(null); }}>
            Reset oefening
          </button>
        )}
      </div>

      {/* Hints */}
      {hintLevel > 0 && (stage.hints?.length ?? 0) > 0 && (
        <ul className="space-y-2">
          {stage.hints!.slice(0, hintLevel).map((h, i) => <li key={i} className="feedback-info">{h}</li>)}
        </ul>
      )}

      {/* Oplossing */}
      {showSolution && (
        <pre className="code">{stage.solution}</pre>
      )}

      {/* Notities */}
      <div className="card card-pad">
        <label className="section-title">Notitie</label>
        <textarea
          className="input mt-2 h-auto py-2"
          rows={2}
          placeholder="Persoonlijke notitie bij deze oefening…"
          defaultValue={note}
          onBlur={(e) => store.setNote(ex.id, e.target.value)}
        />
      </div>
    </div>
  );
}
