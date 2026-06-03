"use client";
import { useIdentity } from "./identity";
import { useProgress } from "./store";

/** Stuurt de huidige score naar de server. Doet niets als er geen naam gekozen is. */
export async function syncIfJoined() {
  if (typeof window === "undefined") return;
  const id = useIdentity.getState();
  if (!id.uid || !id.hasJoinedBoard || !id.name) return;
  const p = useProgress.getState();
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: id.uid,
        name: id.name,
        xp: p.xp,
        solved: Object.keys(p.solved).length,
      }),
      keepalive: true,
    });
  } catch { /* stil falen — leaderboard is optioneel */ }
}
