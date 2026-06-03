/**
 * Alias-tabel: PowerShell-alias (lowercase) -> canonieke cmdlet (lowercase).
 * Gedeeld door de highlighter, de autocomplete én de grader (winGrader).
 * Uitbreiden is veilig: het is puur een lookup-tabel.
 */
export const ALIASES: Record<string, string> = {
  // ── Navigatie & weergave ──────────────────────────────
  gci: "get-childitem", ls: "get-childitem", dir: "get-childitem",
  cd: "set-location", chdir: "set-location", sl: "set-location",
  pwd: "get-location", gl: "get-location",
  cls: "clear-host", clear: "clear-host",
  echo: "write-output", write: "write-output",
  cat: "get-content", type: "get-content", gc: "get-content",
  // ── Pipeline-werkpaarden ──────────────────────────────
  "?": "where-object", where: "where-object",
  "%": "foreach-object", foreach: "foreach-object",
  select: "select-object",
  sort: "sort-object",
  group: "group-object",
  measure: "measure-object",
  gm: "get-member",
  ft: "format-table", fl: "format-list", fw: "format-wide",
  tee: "tee-object",
  compare: "compare-object", diff: "compare-object",
  // ── Bestanden ─────────────────────────────────────────
  copy: "copy-item", cp: "copy-item", cpi: "copy-item",
  move: "move-item", mv: "move-item", mi: "move-item",
  del: "remove-item", rm: "remove-item", ri: "remove-item", erase: "remove-item", rd: "remove-item", rmdir: "remove-item",
  ni: "new-item", md: "new-item", mkdir: "new-item",
  ren: "rename-item", rni: "rename-item",
  // ── Services & processen ──────────────────────────────
  gsv: "get-service",
  gps: "get-process", ps: "get-process",
  kill: "stop-process", spps: "stop-process",
  saps: "start-process", start: "start-process",
  // ── Registry ──────────────────────────────────────────
  gp: "get-itemproperty", sp: "set-itemproperty",
  gpv: "get-itempropertyvalue",
  // ── Diversen ──────────────────────────────────────────
  iwr: "invoke-webrequest", curl: "invoke-webrequest", wget: "invoke-webrequest",
  icm: "invoke-command",
  gcim: "get-ciminstance", gwmi: "get-wmiobject",
  h: "get-history", history: "get-history",
  epcsv: "export-csv", ipcsv: "import-csv",
  gu: "get-unique",
};

/** Set van alle aliassen (lowercase) — handig om een bareword als commando te herkennen. */
export const ALIAS_SET = new Set(Object.keys(ALIASES));

/** Expandeert één token naar zijn canonieke cmdlet (lowercase). Onbekend = onveranderd. */
export function expandAlias(token: string): string {
  const t = token.toLowerCase();
  return ALIASES[t] ?? t;
}
