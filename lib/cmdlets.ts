import raw from "@/data/cmdlets.json";
import { getExercises, type Exercise } from "./exercises";

export type CmdletParam = { name: string; desc: string };
export type CmdletExample = { cmd: string; desc?: string };
export type Cmdlet = {
  name: string;
  aliases?: string[];
  summary: string;
  description?: string;
  syntax?: string;
  parameters?: CmdletParam[];
  examples?: CmdletExample[];
  chapter?: string;
  related?: string[];
};

const ALL = (raw as unknown as Cmdlet[]).slice().sort((a, b) => a.name.localeCompare(b.name));

export function getCmdlets(): Cmdlet[] {
  return ALL;
}
export function getCmdlet(name: string): Cmdlet | undefined {
  const n = decodeURIComponent(name).toLowerCase();
  return ALL.find((c) => c.name.toLowerCase() === n);
}
export function cmdletChapters(): string[] {
  const s = new Set<string>();
  for (const c of ALL) if (c.chapter) s.add(c.chapter);
  return [...s].sort((a, b) => chNum(a) - chNum(b) || a.localeCompare(b));
}
function chNum(ch: string): number {
  const m = /^H(\d+)/i.exec(ch.trim());
  return m ? parseInt(m[1], 10) : 999;
}

/** Vind een oefening die deze cmdlet gebruikt (voor de "Test mij"-knop). */
export function exerciseForCmdlet(name: string): Exercise | undefined {
  const n = name.toLowerCase();
  const ex = getExercises();
  return (
    ex.find((e) => (e.tags ?? []).some((t) => t.toLowerCase() === n)) ??
    ex.find((e) => (e.solution ?? "").toLowerCase().includes(n)) ??
    ex.find((e) => (e.acceptors ?? []).some((a) => a.toLowerCase().includes(n)))
  );
}
