"use client";
import { useState } from "react";
import MockTerminal, { type RunResult } from "@/components/MockTerminal";
import { run as interpRun } from "@/lib/winInterpreter";

const EXAMPLES = [
  "Get-Service | Where-Object Status -eq Running",
  "Get-Process | Sort-Object WS -Descending | Select-Object -First 5 Name, WS",
  "Get-ChildItem | Where-Object { $_.Length -gt 10000 }",
  "Get-Service | Group-Object Status",
  "1..10 | ForEach-Object { $_ * $_ }",
  "$totaal = 0; 1..100 | ForEach-Object { $totaal += $_ }; $totaal",
  "Get-Process | Measure-Object -Property WS -Sum -Average",
  "Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, FreeSpace",
];

function isHelp(cmd: string) {
  const m = cmd.trim().toLowerCase();
  return m === "help" || m.startsWith("help ") || m.startsWith("get-help") || m.startsWith("man ");
}

export default function SandboxPage() {
  const [seed, setSeed] = useState("");
  const [nonce, setNonce] = useState(0);

  async function onRun(cmd: string): Promise<RunResult> {
    if (isHelp(cmd)) return { status: "info", output: ["", "Get-Help — bekijk de Cmdlet-bibliotheek voor uitleg en voorbeelden.", ""] };
    const r = interpRun(cmd);
    if (r.ok) return { output: r.lines.length ? r.lines : ["(geen uitvoer)"], status: undefined };
    if (r.error) return { output: ["Fout: " + r.error], status: "error" };
    return {
      status: "warning",
      output: [
        "⚠ Deze opdracht wordt (nog) niet ondersteund door de sandbox-interpreter.",
        "Ondersteund: Get-Service/Process/ChildItem/LocalUser/CimInstance + Where/Select/Sort/Measure/ForEach/Group,",
        "variabelen, operatoren, rekenen, member-access (.Prop / .Method()), if/for/foreach/while.",
      ],
    };
  }

  function tryExample(cmd: string) { setSeed(cmd); setNonce((n) => n + 1); }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Sandbox</h1>
        <p className="text-2xs text-fg-dim">
          Een vrije PowerShell-speeltuin die je commando&apos;s <span className="text-fg">écht uitvoert</span> op
          voorbeelddata (services, processen, bestanden…). 100% veilig — er draait niets op je echte systeem.
        </p>
      </div>

      <MockTerminal
        key={`sandbox-${nonce}`}
        shell="powershell"
        initialInput={seed}
        placeholder="bv. Get-Process | Sort-Object WS -Descending | Select-Object -First 5"
        greeting={[
          "Windows PowerShell — Sandbox",
          "Echte uitvoering op voorbeelddata. Typ een commando en druk op Enter.",
          "(Tab = aanvullen · ↑↓ = geschiedenis · Ctrl+L = wissen)",
          "",
        ]}
        onRun={onRun}
      />

      <div>
        <div className="section-title mb-2">Probeer een voorbeeld <span className="text-fg-dim normal-case font-normal">(klik om in te vullen, dan Enter)</span></div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => tryExample(ex)} className="chip hover:border-brand hover:text-brand transition-colors font-mono">
              {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad text-2xs text-fg-muted">
        <span className="font-semibold text-fg">Wat werkt er?</span> Pipelines met
        <code className="mx-1 text-brand">Get-Service / Get-Process / Get-ChildItem / Get-LocalUser / Get-CimInstance</code>
        gevolgd door <code className="mx-1 text-brand">Where-Object · Select-Object · Sort-Object · Measure-Object · ForEach-Object · Group-Object</code>,
        plus variabelen, operatoren (<code className="text-tok-op">-eq -gt -like …</code>), rekenen, ranges (<code>1..10</code>),
        member-access en <code>if/for/foreach/while</code>. Complexere scripts (bestanden schrijven, gebruikers aanmaken, registry)
        vallen automatisch terug op de oefening-beoordeling.
      </div>
    </div>
  );
}
