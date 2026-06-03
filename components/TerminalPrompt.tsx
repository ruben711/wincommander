import type { Shell } from "@/lib/exercises";

/** Rendert de linker-prompt in de juiste stijl per shell-type. */
export default function TerminalPrompt({
  shell, path = "C:\\Users\\Ruben", admin = false,
}: { shell: Shell; path?: string; admin?: boolean }) {
  if (shell === "cmd") {
    return (
      <span className="whitespace-pre">
        <span className="term-prompt-path">{path}</span>
        <span className="term-prompt-glyph">{">"} </span>
      </span>
    );
  }
  // PowerShell
  const shownPath = admin ? "C:\\WINDOWS\\system32" : path;
  return (
    <span className="whitespace-pre">
      {admin && <span className="term-shield">🛡 </span>}
      <span className="term-prompt-ps">PS </span>
      <span className="term-prompt-path">{shownPath}</span>
      <span className="term-prompt-glyph">{">"} </span>
    </span>
  );
}
