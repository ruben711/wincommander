"use client";
import { getCmdlets, cmdletChapters } from "@/lib/cmdlets";

const PS_CMD = [
  ["Get-ChildItem", "dir / ls", "Mapinhoud tonen"],
  ["Set-Location", "cd", "Naar map navigeren"],
  ["Get-Content", "type / cat", "Bestandsinhoud tonen"],
  ["Copy-Item", "copy / cp", "Bestand kopiëren"],
  ["Move-Item", "move / mv", "Bestand verplaatsen"],
  ["Remove-Item", "del / rm", "Bestand verwijderen"],
  ["New-Item", "md / mkdir", "Map/bestand maken"],
  ["Clear-Host", "cls / clear", "Scherm leegmaken"],
  ["Write-Output", "echo", "Tekst uitvoeren"],
  ["Get-Help", "help / man", "Hulp opvragen"],
];

const OPERATORS = [
  ["-eq / -ne", "gelijk / niet gelijk"],
  ["-gt / -ge", "groter dan / groter of gelijk"],
  ["-lt / -le", "kleiner dan / kleiner of gelijk"],
  ["-like / -notlike", "wildcard-vergelijking (*?)"],
  ["-match / -notmatch", "regex-vergelijking"],
  ["-contains / -in", "bevat / zit in"],
  ["-and / -or / -not", "logische operatoren"],
];

export default function CheatsheetPage() {
  const chapters = cmdletChapters();
  const all = getCmdlets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Cheat-sheet</h1>
          <p className="text-2xs text-fg-dim">Snelreferentie · printbaar (Ctrl+P)</p>
        </div>
        <button className="btn-primary" onClick={() => window.print()}>🖨 Afdrukken</button>
      </div>

      {/* PowerShell ↔ CMD */}
      <section className="card card-pad break-inside-avoid">
        <h2 className="section-title mb-3">PowerShell ↔ CMD</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[13px]">
          {PS_CMD.map(([ps, cmd, desc]) => (
            <div key={ps} className="flex items-center gap-2 border-b border-line/60 py-1">
              <code className="font-mono text-brand w-36 shrink-0">{ps}</code>
              <code className="font-mono text-fg-muted w-24 shrink-0">{cmd}</code>
              <span className="text-2xs text-fg-dim">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Operatoren */}
      <section className="card card-pad break-inside-avoid">
        <h2 className="section-title mb-3">Vergelijkings- &amp; logische operatoren</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-[13px]">
          {OPERATORS.map(([op, desc]) => (
            <div key={op} className="flex items-center gap-3 py-1">
              <code className="font-mono text-tok-op w-40 shrink-0" style={{ color: "rgb(var(--diff-insane))" }}>{op}</code>
              <span className="text-2xs text-fg-muted">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Cmdlets per hoofdstuk */}
      {all.length > 0 && chapters.map((ch) => {
        const items = all.filter((c) => c.chapter === ch);
        if (items.length === 0) return null;
        return (
          <section key={ch} className="card card-pad break-inside-avoid">
            <h2 className="section-title mb-3">{ch}</h2>
            <div className="space-y-1">
              {items.map((c) => (
                <div key={c.name} className="flex items-baseline gap-3 border-b border-line/50 py-1 text-[13px]">
                  <code className="font-mono text-brand w-44 shrink-0">{c.name}</code>
                  <span className="text-2xs text-fg-muted">{c.summary}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
