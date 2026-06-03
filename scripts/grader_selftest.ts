// Beoordeelt elke oefening's eigen modeloplossing met de echte grader.
// Een falende oefening is fout geauteurd (acceptors/mustInclude matchen de solution niet).
import { gradeCommand } from "../lib/winGrader";
import * as fs from "fs";

const EX = JSON.parse(fs.readFileSync("C:/Users/ruben/WinCommander/data/exercises.json", "utf8")) as any[];

let pass = 0;
const fails: any[] = [];
for (const e of EX) {
  const shell = e.shell || "powershell";
  if (e.type === "multi-step" && Array.isArray(e.steps)) {
    const ok = e.steps.every((s: any) =>
      gradeCommand(s.solution || "", { acceptors: s.acceptors, shell, mustInclude: s.mustInclude, forbid: s.forbid }).correct);
    if (ok) pass++; else fails.push({ id: e.id, type: e.type, sol: "(multi-step)" });
    continue;
  }
  const r = gradeCommand(e.solution || "", {
    acceptors: e.acceptors, shell, mustInclude: e.mustInclude, forbid: e.forbid, acceptRegex: e.acceptRegex,
  });
  if (r.correct) pass++;
  else fails.push({ id: e.id, type: e.type, sol: String(e.solution || "").replace(/\s+/g, " ").slice(0, 75) });
}
console.log(`PASS ${pass} / ${EX.length}  |  FAIL ${fails.length}`);
for (const f of fails) console.log("  FAIL", f.id, "[" + f.type + "]", f.sol);
