"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getExercises, type Difficulty } from "./exercises";

export type Attempt = {
  exerciseId: string;
  ts: number;
  correct: boolean;
  command: string;
  difficulty?: Difficulty;
};

/** Flat XP-systeem: 25 XP bij de EERSTE correcte oplossing.
 *  Insane = 0 XP (enkel eer/bragging rights). Retries geven nooit XP. */
export const XP_TABLE: Record<Difficulty, number> = {
  easy: 25,
  medium: 25,
  hard: 25,
  insane: 0,
};
export function xpFor(d: Difficulty): number {
  return XP_TABLE[d] ?? 0;
}
const XP_RULES_VERSION = 1;

type State = {
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
  solved: Record<string, { firstSolvedAt: number; attempts: number }>;
  attempts: Attempt[];
  /** Laatst ingediende commando per sleutel (exerciseId of `${id}#${stap}`). */
  savedCommands: Record<string, string>;
  favorites: Record<string, true>;
  notes: Record<string, string>;
  xpRulesVersion: number;

  /** Geeft de XP-winst terug zodat de UI dat kan tonen (XpToast). */
  recordAttempt: (a: Omit<Attempt, "ts">) => number;
  getSavedCommand: (key: string) => string | null;
  setSavedCommand: (key: string, cmd: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setNote: (id: string, note: string) => void;
  getNote: (id: string) => string;
  badges: () => string[];
  level: () => { level: number; nextAt: number; prevAt: number; progress: number };
  reset: () => void;
  resetExercise: (id: string) => void;
  recalcXp: () => void;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

function recalcTotal(solved: State["solved"]): number {
  const byId = new Map(getExercises().map((e) => [e.id, e]));
  let xp = 0;
  for (const id of Object.keys(solved)) {
    const ex = byId.get(id);
    if (ex) xp += xpFor(ex.difficulty);
  }
  return xp;
}

export const useProgress = create<State>()(
  persist(
    (set, get) => ({
      xp: 0,
      streakDays: 0,
      lastActiveDate: null,
      solved: {},
      attempts: [],
      savedCommands: {},
      favorites: {},
      notes: {},
      xpRulesVersion: XP_RULES_VERSION,

      recordAttempt: (a) => {
        const st = get();
        const isFirst = a.correct && !st.solved[a.exerciseId];
        const today = todayStr();
        let streak = st.streakDays;
        if (st.lastActiveDate !== today) {
          if (st.lastActiveDate) {
            const diff = Math.round((+new Date(today) - +new Date(st.lastActiveDate)) / 86400000);
            streak = diff === 1 ? streak + 1 : 1;
          } else streak = 1;
        }

        const xpGain = a.correct && isFirst && a.difficulty ? xpFor(a.difficulty) : 0;

        set({
          xp: st.xp + xpGain,
          streakDays: streak,
          lastActiveDate: today,
          attempts: [{ ...a, ts: Date.now() }, ...st.attempts].slice(0, 200),
          solved: a.correct
            ? {
                ...st.solved,
                [a.exerciseId]: {
                  firstSolvedAt: st.solved[a.exerciseId]?.firstSolvedAt ?? Date.now(),
                  attempts: (st.solved[a.exerciseId]?.attempts ?? 0) + 1,
                },
              }
            : st.solved,
        });
        return xpGain;
      },

      getSavedCommand: (key) => get().savedCommands[key] ?? null,
      setSavedCommand: (key, cmd) =>
        set({ savedCommands: { ...get().savedCommands, [key]: cmd } }),

      toggleFavorite: (id) => {
        const fav = { ...get().favorites };
        if (fav[id]) delete fav[id];
        else fav[id] = true;
        set({ favorites: fav });
      },
      isFavorite: (id) => !!get().favorites[id],

      setNote: (id, note) => set({ notes: { ...get().notes, [id]: note } }),
      getNote: (id) => get().notes[id] ?? "",

      badges: () => {
        const st = get();
        const all = getExercises();
        const solvedIds = Object.keys(st.solved);
        const n = solvedIds.length;
        const out: string[] = [];

        // Volume
        if (n >= 1) out.push("🎯 Eerste commando");
        if (n >= 10) out.push("🔟 10 opgelost");
        if (n >= 25) out.push("🥈 25 opgelost");
        if (n >= 50) out.push("🥇 50 opgelost");
        if (n >= 100) out.push("💯 100 opgelost");

        // XP-mijlpalen
        if (st.xp >= 250) out.push("⭐ 250 XP");
        if (st.xp >= 500) out.push("⭐⭐ 500 XP");
        if (st.xp >= 1000) out.push("✨ 1000 XP");
        if (st.xp >= 2000) out.push("🌟 2000 XP");

        // Streaks
        if (st.streakDays >= 3) out.push("🔥 3-dagen streak");
        if (st.streakDays >= 7) out.push("🔥🔥 7-dagen streak");
        if (st.streakDays >= 14) out.push("🔥🔥🔥 14-dagen streak");
        if (st.streakDays >= 30) out.push("🌋 30-dagen streak");

        // Moeilijkheid-mastery
        const byDiff: Record<Difficulty, { done: number; total: number }> = {
          easy: { done: 0, total: 0 }, medium: { done: 0, total: 0 },
          hard: { done: 0, total: 0 }, insane: { done: 0, total: 0 },
        };
        for (const e of all) {
          byDiff[e.difficulty].total++;
          if (st.solved[e.id]) byDiff[e.difficulty].done++;
        }
        if (byDiff.easy.total > 0 && byDiff.easy.done === byDiff.easy.total) out.push("🟢 Alle makkelijke");
        if (byDiff.medium.total > 0 && byDiff.medium.done === byDiff.medium.total) out.push("🟡 Alle gemiddelde");
        if (byDiff.hard.total > 0 && byDiff.hard.done === byDiff.hard.total) out.push("🔴 Alle moeilijke");
        if (byDiff.insane.total > 0 && byDiff.insane.done === byDiff.insane.total) out.push("💀 Tryhard — alle insane");

        // Hoofdstuk-mastery
        const ch: Record<string, { done: number; total: number }> = {};
        for (const e of all) {
          if (!ch[e.chapter]) ch[e.chapter] = { done: 0, total: 0 };
          ch[e.chapter].total++;
          if (st.solved[e.id]) ch[e.chapter].done++;
        }
        const compleet = Object.values(ch).filter((v) => v.total > 0 && v.done === v.total);
        if (compleet.length >= 1) out.push("📚 Hoofdstuk compleet");
        if (compleet.length >= 5) out.push("📚📚 5 hoofdstukken compleet");
        if (compleet.length >= 10) out.push("📚📚📚 10 hoofdstukken compleet");

        // Shell-specifiek
        const psAll = all.filter((e) => e.shell === "powershell");
        const psDone = psAll.filter((e) => st.solved[e.id]).length;
        if (psAll.length > 0 && psDone === psAll.length) out.push("💙 PowerShell-meester");
        const cmdAll = all.filter((e) => e.shell === "cmd");
        const cmdDone = cmdAll.filter((e) => st.solved[e.id]).length;
        if (cmdAll.length > 0 && cmdDone === cmdAll.length) out.push("⬛ CMD-veteraan");

        // Speciaal
        if (n === all.length && all.length > 0) out.push("🏆 100% — alles opgelost");
        if (st.attempts.length >= 100) out.push("👨‍💻 100 pogingen");
        if (st.attempts.length >= 500) out.push("🧑‍🔬 500 pogingen");

        return out;
      },

      level: () => {
        const xp = get().xp;
        let lvl = 1, need = 100, acc = 0;
        while (xp >= acc + need) { acc += need; lvl++; need = Math.round(need * 1.25); }
        return { level: lvl, prevAt: acc, nextAt: acc + need, progress: (xp - acc) / need };
      },

      reset: () =>
        set({
          xp: 0, streakDays: 0, lastActiveDate: null,
          solved: {}, attempts: [], savedCommands: {}, favorites: {}, notes: {},
        }),

      resetExercise: (id) => {
        const st = get();
        const solved = { ...st.solved }; delete solved[id];
        const saved = { ...st.savedCommands };
        for (const k of Object.keys(saved)) if (k === id || k.startsWith(id + "#")) delete saved[k];
        set({ solved, savedCommands: saved, xp: recalcTotal(solved) });
      },

      recalcXp: () =>
        set({ xp: recalcTotal(get().solved), xpRulesVersion: XP_RULES_VERSION }),
    }),
    {
      name: "wincommander-progress",
      version: 1,
    }
  )
);
