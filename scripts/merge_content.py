"""Voegt de agent-uitvoer (.source/out_*.json) samen tot data/exercises.json,
data/cmdlets.json en data/theorie.json — met validatie en dedup."""
import json, os, glob, sys

SRC = r"C:\Users\ruben\WinCommander\.source"
DATA = r"C:\Users\ruben\WinCommander\data"

DIFFS = {"easy", "medium", "hard", "insane"}
SHELLS = {"powershell", "cmd"}

def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"  ! kon {os.path.basename(path)} niet lezen: {e}")
        return None

exercises, cmdlets, theory = [], [], []
warnings = []

for path in sorted(glob.glob(os.path.join(SRC, "out_*.json"))):
    data = load(path)
    if not data:
        continue
    name = os.path.basename(path)
    exercises += [(name, e) for e in data.get("exercises", [])]
    cmdlets += [(name, c) for c in data.get("cmdlets", [])]
    theory += [(name, t) for t in data.get("theory", [])]
    print(f"  + {name}: {len(data.get('exercises', []))} ex, {len(data.get('cmdlets', []))} cmdlets, {len(data.get('theory', []))} theory")

# ---- Exercises: valideren + id-dedup ----
seen_ids = set()
out_ex = []
for src, e in exercises:
    if not isinstance(e, dict):
        warnings.append(f"ex (geen object) in {src}"); continue
    eid = str(e.get("id", "")).strip()
    if not eid or not e.get("prompt") or not e.get("title"):
        warnings.append(f"ex zonder id/title/prompt in {src}"); continue
    if e.get("difficulty") not in DIFFS:
        e["difficulty"] = "medium"
    if e.get("shell") not in SHELLS:
        e["shell"] = "powershell"
    e.setdefault("type", "command")
    gradeable = bool(e.get("acceptors")) or bool(e.get("mustInclude")) or bool(e.get("steps"))
    if not gradeable:
        warnings.append(f"ex {eid} niet beoordeelbaar (geen acceptors/mustInclude/steps) — overgeslagen"); continue
    base = eid
    n = 2
    while eid in seen_ids:
        eid = f"{base}-{n}"; n += 1
    e["id"] = eid
    seen_ids.add(eid)
    out_ex.append(e)

# ---- Cmdlets: dedup op naam (rijkste entry winnen) ----
def richness(c):
    return len(c.get("parameters", []) or []) * 3 + len(c.get("examples", []) or []) * 3 + len(c.get("description", "") or "")
by_name = {}
for src, c in cmdlets:
    if not isinstance(c, dict):
        continue
    nm = str(c.get("name", "")).strip()
    if not nm or not c.get("summary"):
        continue
    key = nm.lower()
    if key not in by_name or richness(c) > richness(by_name[key]):
        by_name[key] = c
out_cmd = sorted(by_name.values(), key=lambda c: c["name"].lower())

# ---- Theory ----
out_theory = []
for src, t in theory:
    if not isinstance(t, dict):
        continue
    if t.get("type") not in {"mc", "open"} or not t.get("question") or not t.get("answer"):
        warnings.append(f"theory ongeldig in {src}"); continue
    out_theory.append(t)

os.makedirs(DATA, exist_ok=True)
json.dump(out_ex, open(os.path.join(DATA, "exercises.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(out_cmd, open(os.path.join(DATA, "cmdlets.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(out_theory, open(os.path.join(DATA, "theorie.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print(f"\n=> exercises.json: {len(out_ex)}  |  cmdlets.json: {len(out_cmd)}  |  theorie.json: {len(out_theory)}")
# verdeling per hoofdstuk
chap = {}
for e in out_ex:
    chap[e["chapter"]] = chap.get(e["chapter"], 0) + 1
for k in sorted(chap):
    print(f"   {k}: {chap[k]}")
if warnings:
    print(f"\n{len(warnings)} waarschuwingen:")
    for w in warnings[:25]:
        print("   -", w)
