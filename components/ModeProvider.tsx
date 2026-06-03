"use client";
import { useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useProgress } from "@/lib/store";

/** App-level provider: past het thema toe (anti-FOUC + systeemwissels) en
 *  triggert een XP-herrekening wanneer de XP-regels gewijzigd zijn.
 *  (Heet historisch "ModeProvider" — WinCommander heeft geen exam/general-modi.) */
export default function ModeProvider({ children }: { children: React.ReactNode }) {
  const apply = useTheme((s) => s.apply);

  useEffect(() => {
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const h = () => apply();
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [apply]);

  // Eenmalig: als de XP-regels gewijzigd zijn → herbereken met de huidige tabel.
  useEffect(() => {
    const TARGET = 1; // moet overeenkomen met XP_RULES_VERSION in store.ts
    const cur = useProgress.getState().xpRulesVersion ?? 0;
    if (cur < TARGET) useProgress.getState().recalcXp();
  }, []);

  return <>{children}</>;
}
