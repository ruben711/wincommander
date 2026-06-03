import { ALIAS_SET } from "./winAliases";
import { CMDLET_SET } from "./winCmdlets";

/** Token-types voor weergave (kosmetisch — niet voor grading). */
export type HTokenType =
  | "cmd" | "param" | "string" | "comment" | "var" | "num" | "op" | "prop" | "plain";
export type HToken = { t: HTokenType; v: string };

/** PowerShell vergelijkings-/logische operatoren (lowercase, incl. streepje). */
const PS_OPERATORS = new Set([
  "-eq", "-ne", "-gt", "-ge", "-lt", "-le", "-like", "-notlike", "-match", "-notmatch",
  "-contains", "-notcontains", "-in", "-notin", "-and", "-or", "-not", "-xor",
  "-band", "-bor", "-join", "-split", "-replace", "-is", "-isnot", "-as", "-f", "-ceq", "-cne",
]);

const isWS = (c: string) => /\s/.test(c);
const isWordStart = (c: string) => /[A-Za-z0-9_\\.:*?%/]/.test(c);

/** Splitst een PowerShell-regel in gekleurde tokens. Best-effort, geen volledige parser. */
export function tokenize(input: string): HToken[] {
  const out: HToken[] = [];
  let i = 0;
  const n = input.length;
  let cmdPos = true; // "command-positie": start van de regel of net na | ; { (

  while (i < n) {
    const c = input[i];

    if (isWS(c)) {
      let j = i + 1; while (j < n && isWS(input[j])) j++;
      out.push({ t: "plain", v: input.slice(i, j) }); i = j; continue;
    }
    if (c === "#") { out.push({ t: "comment", v: input.slice(i) }); break; }

    if (c === "'" || c === '"') {
      const q = c; let j = i + 1; while (j < n && input[j] !== q) j++; if (j < n) j++;
      out.push({ t: "string", v: input.slice(i, j) }); i = j; cmdPos = false; continue;
    }

    if (c === "$") {
      let j = i + 1;
      if (input[j] === "{") { while (j < n && input[j] !== "}") j++; if (j < n) j++; }
      else if (input[j] === "_") j++;
      else while (j < n && /[A-Za-z0-9_:]/.test(input[j])) j++;
      out.push({ t: "var", v: input.slice(i, j) }); i = j; cmdPos = false; continue;
    }

    if (c === "." && i + 1 < n && /[A-Za-z_]/.test(input[i + 1])) {
      let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(input[j])) j++;
      out.push({ t: "prop", v: input.slice(i, j) }); i = j; continue;
    }

    if ("|;{}()=,".includes(c)) {
      out.push({ t: "op", v: c }); i++;
      if (c === "|" || c === ";" || c === "{" || c === "(") cmdPos = true;
      continue;
    }
    if (c === ">" || c === "<") {
      let j = i + 1; if (input[j] === c) j++;
      out.push({ t: "op", v: input.slice(i, j) }); i = j; continue;
    }

    // -word  →  operator (-eq) of parameter (-Name)
    if (c === "-") {
      let j = i + 1; while (j < n && /[A-Za-z]/.test(input[j])) j++;
      const word = input.slice(i, j);
      if (word.length === 1) { out.push({ t: "plain", v: word }); i = j; continue; }
      out.push({ t: PS_OPERATORS.has(word.toLowerCase()) ? "op" : "param", v: word });
      i = j; continue;
    }

    // bareword / cmdlet / alias / getal / pad / wildcard
    if (isWordStart(c)) {
      let j = i;
      while (j < n) {
        const ch = input[j];
        if (/[A-Za-z0-9_\\.:*?%/]/.test(ch)) { j++; continue; }
        if (ch === "-" && j + 1 < n && /[A-Za-z]/.test(input[j + 1])) { j++; continue; } // Get-Service
        break;
      }
      const w = input.slice(i, j);
      const lw = w.toLowerCase();
      let t: HTokenType = "plain";
      if (/^\d+(\.\d+)?$/.test(w)) t = "num";
      else if (/^[A-Za-z]+-[A-Za-z]+/.test(w)) t = "cmd"; // Verb-Noun
      else if (CMDLET_SET.has(lw)) t = "cmd";
      else if (cmdPos && (ALIAS_SET.has(lw) || lw === "?" || lw === "%")) t = "cmd";
      out.push({ t, v: w }); i = j; cmdPos = false; continue;
    }

    out.push({ t: "plain", v: c }); i++;
  }
  return out;
}
