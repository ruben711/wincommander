import { run } from "../lib/winInterpreter";

const cases: [string, string][] = [
  ["Get-Service | Where-Object Status -eq Running", "running services"],
  ["Get-Service | Where-Object { $_.Status -eq 'Running' } | Measure-Object", "count running"],
  ["Get-Service -Name Win*", "win* services"],
  ["gsv | ? Status -eq Stopped | Select-Object Name", "stopped names"],
  ["Get-Process | Sort-Object WS -Descending | Select-Object -First 5 Name, WS", "top5 mem"],
  ["Get-ChildItem | Where-Object { $_.Length -gt 10000 }", "big files"],
  ["Get-ChildItem | Where-Object { $_.Length -eq 0 } | Select-Object Name", "empty files"],
  ["1..5", "range"],
  ["$x = 10; $y = 20; $x + $y", "30"],
  ["(2 + 3) * 4", "20"],
  ["\"hallo\".ToUpper()", "HALLO"],
  ["$sum = 0; foreach ($n in 1..10) { $sum += $n }; $sum", "55"],
  ["for ($i = 1; $i -le 3; $i++) { Write-Output \"regel $i\" }", "for loop"],
  ["Get-Process | Measure-Object -Property WS -Sum", "sum ws"],
  ["Get-Service | Group-Object Status", "group by status"],
  ["if (5 -gt 3) { 'ja' } else { 'nee' }", "if"],
  ["Get-WmiObject Win32_Processor | Select-Object NumberOfCores", "cores"],
  ["Get-Process | Where-Object { $_.WS -gt 200MB } | Select-Object Name", "wmi-ish mem filter"],
];

for (const [cmd, label] of cases) {
  const r = run(cmd);
  console.log("### " + label + "  ::  " + cmd);
  if (r.unsupported) console.log("   [UNSUPPORTED -> fallback grader]");
  else if (r.error) console.log("   [ERROR] " + r.error);
  else console.log((r.lines.length ? r.lines.map((l) => "   " + l).join("\n") : "   (geen output)"));
  console.log();
}
