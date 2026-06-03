import { expandAlias } from "./winAliases";
import type { Shell } from "./exercises";

/**
 * Normaliseert een commando tot een canonieke vorm zodat equivalente
 * commando's exact gelijk worden. Bewust hoofdletter-, quote-, alias-,
 * spatie- en (voor PowerShell) scriptblock-/volgorde-ongevoelig.
 *
 * Voorbeeld — al deze normaliseren naar dezelfde string:
 *   Get-Service | Where-Object Status -eq Running
 *   gsv | ? Status -eq 'Running'
 *   Get-Service | Where-Object { $_.Status -eq "Running" }
 */
export function normalize(input: string, shell: Shell = "powershell"): string {
  let s = input ?? "";

  // 1) Comment verwijderen (# tot einde regel, aan begin of na spatie)
  s = s.replace(/(^|\s)#.*$/, "$1");

  // 2) Hoofdletter-ongevoelig
  s = s.toLowerCase();

  // 3) Quotes normaliseren: 'x' = "x" = x
  s = s.replace(/(['"])(.*?)\1/g, "$2");

  if (shell === "powershell") {
    // 4) Scriptblock-vorm gelijkstellen aan shorthand:
    //    { $_.Status -eq 'Running' }  ->  status -eq running
    s = s.replace(/\$psitem\./g, "").replace(/\$_\./g, "").replace(/[{}]/g, " ");
  }

  // 5) Pijp als duidelijke scheider
  s = s.replace(/\|/g, " | ");

  // 6) Per pipeline-stage: commando-alias expanderen + parameter-volgorde negeren
  const stages = s.split("|").map((stage) => {
    const toks = stage.trim().split(/\s+/).filter(Boolean);
    if (toks.length === 0) return "";
    if (shell === "powershell") toks[0] = expandAlias(toks[0]);
    const rest = toks.slice(1).sort();
    return [toks[0], ...rest].join(" ");
  }).filter(Boolean);

  return stages.join(" | ").replace(/\s+/g, " ").trim();
}

/** Losse tokens van een genormaliseerde string. */
export function normTokens(input: string, shell: Shell = "powershell"): string[] {
  return normalize(input, shell).split(/[\s|]+/).filter(Boolean);
}

/**
 * Soepele normalisatie voor mustInclude/forbid — GEEN pipeline-canonicalisatie
 * (geen stage-split/sortering), zodat ze ook op meerregelige scripts werken.
 * Lowercase · comments weg · quotes weg · aliassen per token expanderen · witruimte plat.
 */
export function normalizeLoose(input: string, shell: Shell = "powershell"): string {
  let s = input ?? "";
  s = s.replace(/(^|\s)#.*$/gm, "$1");       // comments op elke regel
  s = s.toLowerCase();
  s = s.replace(/(['"])(.*?)\1/g, "$2");      // unquote
  const toks = s.split(/\s+/).filter(Boolean).map((t) => (shell === "powershell" ? expandAlias(t) : t));
  return toks.join(" ");
}

export function looseTokens(input: string, shell: Shell = "powershell"): string[] {
  return normalizeLoose(input, shell).split(/\s+/).filter(Boolean);
}
