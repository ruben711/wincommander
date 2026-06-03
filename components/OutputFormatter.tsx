import type { RunStatus } from "./MockTerminal";

const STATUS_CLASS: Partial<Record<RunStatus, string>> = {
  error: "term-error",
  warning: "term-warning",
  ok: "term-success",
  dim: "term-dim",
};

const isRule = (s: string) => /^[\s-]+$/.test(s) && s.includes("-");

/** Rendert gesimuleerde uitvoer. Bij neutrale output kleurt het de
 *  Format-Table kolomheaders + de `----` scheidingslijn (PowerShell-stijl). */
export default function OutputFormatter({
  lines, status,
}: { lines: string[]; status?: RunStatus }) {
  if (!lines || lines.length === 0) return null;

  const statusClass = status ? STATUS_CLASS[status] : undefined;

  // Gekleurde status-output (fout/waarschuwing/…): geen tabel-detectie.
  if (statusClass) {
    return <pre className={`term-output ${statusClass}`}>{lines.join("\n")}</pre>;
  }

  return (
    <pre className="term-output">
      {lines.map((line, i) => {
        const rule = isRule(line);
        const header = !rule && i + 1 < lines.length && isRule(lines[i + 1]);
        const cls = rule ? "rule" : header ? "hdr" : undefined;
        return (
          <span key={i} className={cls}>
            {line}
            {i < lines.length - 1 ? "\n" : ""}
          </span>
        );
      })}
    </pre>
  );
}
