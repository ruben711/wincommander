import raw from "@/data/theorie.json";

export type TheoryQ = {
  chapter: string;
  subtopic?: string;
  type: "mc" | "open";
  question: string;
  choices?: string[];
  answer: string;
  explanation?: string;
};

const ALL = raw as unknown as TheoryQ[];

// Vaste volgorde: PowerShell-concepten eerst, dan ITIL, dan de rest.
const ORDER = ["PowerShell concepten", "ITIL 4 Foundation"];
function rank(ch: string): number {
  const i = ORDER.indexOf(ch);
  return i === -1 ? ORDER.length : i;
}

export function getTheory(): TheoryQ[] {
  return ALL;
}
export function theoryChapters(): string[] {
  const s = new Set<string>();
  for (const q of ALL) s.add(q.chapter);
  return [...s].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
export function theoryByChapter(): { chapter: string; items: TheoryQ[] }[] {
  return theoryChapters().map((chapter) => ({
    chapter,
    items: ALL.filter((q) => q.chapter === chapter),
  }));
}
