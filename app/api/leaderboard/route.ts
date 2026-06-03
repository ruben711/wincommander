import { NextRequest } from "next/server";
import { getJson, setJson, isConfigured } from "@/lib/upstash";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const KEY = "lb:v1";
const MAX_ENTRIES = 500;
const MAX_NAME_LEN = 24;

type CustomTag = { label: string; color: string; emoji?: string };
type NameStyle = Record<string, any>;
type Entry = {
  uid: string;
  name: string;
  xp: number;
  solved: number;
  updatedAt: number;
  admin?: boolean;
  customTag?: CustomTag | null;
  nameStyle?: NameStyle | null;
};

function sanitizeName(s: string): string {
  return String(s || "").replace(/[<>]/g, "").trim().slice(0, MAX_NAME_LEN) || "Anoniem";
}
function clampInt(v: any): number {
  return Math.max(0, Math.floor(Number(v) || 0));
}

// ─── GET: ranglijst ────────────────────────────────────────────────
export async function GET() {
  if (!isConfigured) {
    return Response.json({ ok: false, error: "storage_not_configured", entries: [] }, { status: 503 });
  }
  const list = (await getJson<Entry[]>(KEY)) || [];
  const sorted = [...list].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0) || (b.solved ?? 0) - (a.solved ?? 0));
  return Response.json({ ok: true, total: list.length, entries: sorted.slice(0, 200), updatedAt: Date.now() });
}

// ─── POST: eigen score upserten ────────────────────────────────────
const submissions = new Map<string, number>();

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return Response.json({ ok: false, error: "storage_not_configured" }, { status: 503 });
  }
  let body: any;
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  const uid = String(body?.uid || "").trim();
  if (!uid || uid.length < 8 || uid.length > 64) return new Response("Invalid uid", { status: 400 });

  const now = Date.now();
  if (now - (submissions.get(uid) || 0) < 5_000) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  submissions.set(uid, now);

  const list = (await getJson<Entry[]>(KEY)) || [];
  const idx = list.findIndex((e) => e.uid === uid);
  const existing = idx >= 0 ? list[idx] : null;
  const entry: Entry = {
    uid,
    name: sanitizeName(body?.name),
    xp: clampInt(body?.xp),
    solved: clampInt(body?.solved),
    updatedAt: now,
    // admin/tag/nameStyle bewaren bij re-sync (worden later via admin gezet)
    admin: existing?.admin || false,
    customTag: existing?.customTag ?? null,
    nameStyle: existing?.nameStyle ?? null,
  };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);

  if (list.length > MAX_ENTRIES) {
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    list.length = MAX_ENTRIES;
  }
  await setJson(KEY, list);
  return Response.json({ ok: true, entry });
}
