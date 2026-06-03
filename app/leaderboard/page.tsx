"use client";
import { useCallback, useEffect, useState } from "react";
import { useMounted } from "@/lib/useMounted";
import { useIdentity } from "@/lib/identity";
import { useProgress } from "@/lib/store";
import { syncIfJoined } from "@/lib/leaderboardSync";
import StyledName, { type NameStyleData } from "@/components/StyledName";
import CustomTag, { type CustomTagData } from "@/components/CustomTag";

type Entry = {
  uid: string; name: string; xp: number; solved: number; updatedAt: number;
  admin?: boolean; customTag?: CustomTagData | null; nameStyle?: NameStyleData | null;
};

function levelOf(xp: number) {
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = Math.round(need * 1.25); }
  return lvl;
}

export default function LeaderboardPage() {
  const mounted = useMounted();
  const id = useIdentity();
  const store = useProgress();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "notconfigured" | "error">("loading");
  const [nameInput, setNameInput] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/leaderboard", { cache: "no-store" });
      if (r.status === 503) { setStatus("notconfigured"); return; }
      const j = await r.json();
      if (j.ok) { setEntries(j.entries || []); setStatus("ok"); } else setStatus("error");
    } catch { setStatus("error"); }
  }, []);

  useEffect(() => { id.ensure(); }, [id]);
  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 20000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    if (mounted && id.hasJoinedBoard && id.name) syncIfJoined().then(() => setTimeout(load, 500));
  }, [mounted, id.hasJoinedBoard, id.name, load]);

  function join() {
    const n = nameInput.trim();
    if (!n) return;
    id.set(n);
    setEditing(false);
    syncIfJoined().then(() => setTimeout(load, 500));
  }

  if (!mounted) return <div className="empty-state text-fg-dim">Laden…</div>;

  const myXp = store.xp;
  const myLevel = levelOf(myXp);
  const mySolved = Object.keys(store.solved).length;
  const myRank = entries.findIndex((e) => e.uid === id.uid) + 1;
  const joined = id.hasJoinedBoard && !!id.name;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">🏆 Leaderboard</h1>
        <p className="text-2xs text-fg-dim">Online ranglijst op XP · vernieuwt elke 20 s</p>
      </div>

      {/* Identiteit / meedoen */}
      <div className="card card-pad">
        {!joined || editing ? (
          <div>
            <label className="section-title">Kies je naam om mee te doen</label>
            <div className="flex flex-wrap gap-2 mt-2">
              <input
                className="input max-w-xs flex-1 min-w-[180px]"
                placeholder="bv. Ruben"
                maxLength={24}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && join()}
              />
              <button className="btn" onClick={() => setNameInput(id.randomName())}>🎲 Willekeurig</button>
              <button className="btn-primary" onClick={join} disabled={!nameInput.trim()}>Doe mee</button>
            </div>
            <p className="text-2xs text-fg-dim mt-2">Je voortgang staat al lokaal opgeslagen; meedoen deelt enkel je naam + XP.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-lg bg-brand/15 text-brand font-bold font-mono">{myLevel}</div>
              <div>
                <div className="font-semibold">Je speelt als {id.name}</div>
                <div className="text-2xs text-fg-muted">
                  {myXp} XP · {mySolved} opgelost{status === "ok" && myRank > 0 ? ` · plaats #${myRank}` : ""}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => { setNameInput(id.name || ""); setEditing(true); }}>Wijzig naam</button>
              <button className="btn btn-sm" onClick={() => { syncIfJoined().then(() => setTimeout(load, 400)); }}>↻ Sync</button>
            </div>
          </div>
        )}
      </div>

      {/* Status: niet geconfigureerd */}
      {status === "notconfigured" && (
        <div className="card card-pad">
          <div className="feedback-warn mb-3">De online leaderboard is nog niet ingesteld op de server.</div>
          <p className="text-[13px] text-fg-muted">Activeer 'm gratis met een Upstash Redis-database:</p>
          <ol className="mt-2 space-y-1.5 text-[13px] list-decimal list-inside text-fg-muted">
            <li>Maak een database op <a className="link" href="https://console.upstash.com" target="_blank" rel="noreferrer">console.upstash.com</a> (Redis, regio eu-west-1).</li>
            <li>Kopieer <code className="code">UPSTASH_REDIS_REST_URL</code> en <code className="code">UPSTASH_REDIS_REST_TOKEN</code>.</li>
            <li>Zet ze in Vercel → Project → Settings → <strong>Environment Variables</strong> en redeploy.</li>
          </ol>
          <p className="text-2xs text-fg-dim mt-3">Tot dan werkt de hele app gewoon; enkel de gedeelde ranglijst is uit.</p>
        </div>
      )}

      {status === "error" && <div className="feedback-err">Kon de ranglijst niet laden. Probeer later opnieuw.</div>}

      {/* De ranglijst */}
      {status === "ok" && (
        entries.length === 0 ? (
          <div className="empty-state"><span className="text-3xl">🏁</span><p>Nog niemand op het bord — wees de eerste!</p></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-[3rem_1fr_4rem_5rem_5rem] gap-2 px-3 h-9 items-center border-b border-line text-2xs uppercase tracking-wider text-fg-muted font-semibold">
              <span>#</span><span>Naam</span><span className="text-right">Lvl</span><span className="text-right">XP</span><span className="text-right">Opgelost</span>
            </div>
            {entries.map((e, i) => {
              const me = e.uid === id.uid;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <div key={e.uid}
                  className={`grid grid-cols-[3rem_1fr_4rem_5rem_5rem] gap-2 px-3 h-11 items-center border-b border-line/60 text-[13px] ${me ? "bg-brand/10" : ""}`}>
                  <span className="font-mono text-fg-muted">{medal ?? i + 1}</span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate"><StyledName name={e.name} style={e.nameStyle} /></span>
                    {e.admin && <span className="admin-tag">👑 admin</span>}
                    {e.customTag && <CustomTag tag={e.customTag} />}
                    {me && <span className="chip-brand">jij</span>}
                  </span>
                  <span className="text-right font-mono text-fg-muted">{levelOf(e.xp)}</span>
                  <span className="text-right font-mono font-semibold">{e.xp}</span>
                  <span className="text-right font-mono text-fg-muted">{e.solved}</span>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
