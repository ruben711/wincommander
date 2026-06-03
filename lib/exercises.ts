import raw from "@/data/exercises.json";

export type Difficulty = "easy" | "medium" | "hard" | "insane";
export type Shell = "powershell" | "cmd";

/** Oefening-types (zie brief). "command" is de standaard. */
export type ExerciseType =
  | "command"     // typ het juiste commando in de terminal
  | "script"      // meerregelig script (token-gebaseerde beoordeling)
  | "multi-step"  // meerdere commando's na elkaar
  | "predict"     // output voorspellen (MC of kort antwoord)
  | "fill-blank"  // vul de ontbrekende stukken in
  | "debug";      // fix het foute commando

export type Step = {
  prompt: string;
  acceptors: string[];
  mustInclude?: string[];
  forbid?: string[];
  outputMock?: string[];
  solution: string;
  hints?: string[];
};

export type Exercise = {
  id: string;
  chapter: string;          // bv. "H5 Services"
  title: string;
  difficulty: Difficulty;
  shell: Shell;
  type?: ExerciseType;      // default "command"
  tags?: string[];
  prompt: string;

  /** command / fill-blank / debug */
  acceptors?: string[];     // geldige (genormaliseerde) commando-vormen
  acceptRegex?: string[];   // vrije-vorm regex-fallback (case-insensitive)
  mustInclude?: string[];   // tokens die sowieso aanwezig moeten zijn (lenient)
  forbid?: string[];        // tokens die NIET mogen voorkomen
  outputMock?: string[];    // gesimuleerde uitvoer bij correct
  hints?: string[];
  solution?: string;        // modeloplossing
  starter?: string;         // voorgevulde tekst (fill-blank / debug)
  admin?: boolean;          // toon de admin-prompt (🛡 system32)

  /** multi-step */
  steps?: Step[];

  /** predict-output */
  given?: string;           // het gegeven commando
  choices?: string[];       // MC-opties
  answer?: string;          // correcte keuze / kort antwoord
};

const ALL = (raw as unknown as Exercise[]).map((e) => ({ ...e, type: e.type ?? "command" }));

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "insane"];

export function getExercises(): Exercise[] {
  return ALL;
}
export function getExercise(id: string): Exercise | undefined {
  return ALL.find((e) => e.id === id);
}

/** Nummer uit een hoofdstuk-label halen ("H12 Geplande taken" -> 12) voor sortering. */
function chapterNum(ch: string): number {
  const m = /^H(\d+)/i.exec(ch.trim());
  return m ? parseInt(m[1], 10) : 999;
}

/** Hoofdstukken in cursusvolgorde (H1, H2, ...). */
export function chapters(): string[] {
  const seen = new Set<string>();
  for (const e of ALL) seen.add(e.chapter);
  return [...seen].sort((a, b) => chapterNum(a) - chapterNum(b) || a.localeCompare(b));
}

export function byChapter(): { chapter: string; items: Exercise[] }[] {
  return chapters().map((chapter) => ({
    chapter,
    items: ALL.filter((e) => e.chapter === chapter),
  }));
}

export function allTags(): string[] {
  const s = new Set<string>();
  for (const e of ALL) (e.tags ?? []).forEach((t) => s.add(t));
  return [...s].sort();
}

export function nextExercise(id: string): Exercise | undefined {
  const i = ALL.findIndex((e) => e.id === id);
  return i >= 0 && i < ALL.length - 1 ? ALL[i + 1] : undefined;
}
export function prevExercise(id: string): Exercise | undefined {
  const i = ALL.findIndex((e) => e.id === id);
  return i > 0 ? ALL[i - 1] : undefined;
}

/** Willekeurige steekproef (examensimulatie). */
export function randomSample(
  n: number,
  opts?: { shell?: Shell; difficulty?: Difficulty; chapters?: string[] }
): Exercise[] {
  let pool = ALL.slice();
  if (opts?.shell) pool = pool.filter((e) => e.shell === opts.shell);
  if (opts?.difficulty) pool = pool.filter((e) => e.difficulty === opts.difficulty);
  if (opts?.chapters?.length) pool = pool.filter((e) => opts.chapters!.includes(e.chapter));
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
