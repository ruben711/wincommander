import { normalize, normalizeLoose, looseTokens } from "./winTokenizer";
import type { Exercise, Step, Shell } from "./exercises";

export type GradeResult = {
  correct: boolean;
  matchedAcceptor?: string;
  /** Gerichte feedback bij een fout antwoord (optioneel). */
  feedback?: string;
};

export type GradeSpec = {
  acceptors?: string[];
  shell?: Shell;
  mustInclude?: string[];
  forbid?: string[];
  acceptRegex?: string[];
};

/**
 * Beoordeelt een commando tegen een set acceptors.
 * Strategie (zie brief): normaliseer student + acceptors identiek en vergelijk;
 * met optionele forbid (hard falen), regex-fallback en lenient mustInclude.
 */
export function gradeCommand(command: string, spec: GradeSpec): GradeResult {
  const shell = spec.shell ?? "powershell";
  const S = normalize(command, shell);
  if (!S) return { correct: false };

  // Soepele tokens (voor forbid/mustInclude) — werkt ook op meerregelige scripts
  const L = normalizeLoose(command, shell);
  const lTokens = looseTokens(command, shell);
  const has = (term: string) => {
    const t = normalizeLoose(term, shell);
    return !!t && (lTokens.includes(t) || L.includes(t));
  };

  // 0) Verboden tokens → hard falen (handig voor debug-/“gebruik geen X”-oefeningen)
  if (spec.forbid?.length) {
    for (const f of spec.forbid) {
      if (has(f)) return { correct: false, feedback: `Vermijd \`${f}\` — er is een betere aanpak.` };
    }
  }

  // 1) Canonieke gelijkheid met een acceptor
  for (const a of spec.acceptors ?? []) {
    if (normalize(a, shell) === S) return { correct: true, matchedAcceptor: a };
  }

  // 2) Regex-fallback voor vrije expressies (tegen het ruwe commando, case-insensitive)
  if (spec.acceptRegex?.length) {
    const raw = command.trim();
    for (const p of spec.acceptRegex) {
      try { if (new RegExp(p, "i").test(raw)) return { correct: true }; } catch { /* ongeldige regex negeren */ }
    }
  }

  // 3) mustInclude: alle vereiste tokens aanwezig. Voor type "script" is dit de
  //    hoofd-beoordeling; voor command-type een soepel vangnet bij variabele delen.
  if (spec.mustInclude?.length) {
    if (spec.mustInclude.every(has)) return { correct: true };
  }

  return { correct: false };
}

/** Beoordeelt het hoofd-commando van een (command-type) oefening. */
export function gradeExercise(command: string, ex: Exercise): GradeResult {
  return gradeCommand(command, {
    acceptors: ex.acceptors,
    shell: ex.shell,
    mustInclude: ex.mustInclude,
    forbid: ex.forbid,
    acceptRegex: (ex as any).acceptRegex,
  });
}

/** Beoordeelt één stap van een multi-step oefening. */
export function gradeStep(command: string, step: Step, shell: Shell): GradeResult {
  return gradeCommand(command, {
    acceptors: step.acceptors,
    shell,
    mustInclude: step.mustInclude,
    forbid: step.forbid,
  });
}
