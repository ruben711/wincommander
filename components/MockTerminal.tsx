"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Highlight from "./Highlight";
import TerminalPrompt from "./TerminalPrompt";
import OutputFormatter from "./OutputFormatter";
import type { Shell } from "@/lib/exercises";
import { CMDLETS } from "@/lib/winCmdlets";

export type RunStatus = "ok" | "error" | "warning" | "info" | "dim";
export type RunResult = { output?: string[]; status?: RunStatus; clear?: boolean };

type Block = { id: number; command: string | null; output: string[]; status?: RunStatus };

type Props = {
  shell?: Shell;
  promptPath?: string;
  admin?: boolean;
  tabLabel?: string;
  cmdlets?: string[];
  greeting?: string[];
  initialInput?: string;
  placeholder?: string;
  onRun: (command: string) => RunResult | Promise<RunResult>;
  onChange?: (value: string) => void;
};

const CLEAR_WORDS = new Set(["clear", "cls", "clear-host"]);

export default function MockTerminal({
  shell = "powershell",
  promptPath = "C:\\Users\\Ruben",
  admin = false,
  tabLabel,
  cmdlets,
  greeting,
  initialInput = "",
  placeholder,
  onRun,
  onChange,
}: Props) {
  const completions = cmdlets ?? CMDLETS;
  const seedBlocks = useMemo<Block[]>(
    () => (greeting && greeting.length ? [{ id: 0, command: null, output: greeting }] : []),
    [greeting],
  );

  const [blocks, setBlocks] = useState<Block[]>(seedBlocks);
  const [input, setInput] = useState(initialInput);
  const [busy, setBusy] = useState(false);

  const [history, setHistory] = useState<string[]>([]);
  const histIdx = useRef<number | null>(null);

  const [sugOpen, setSugOpen] = useState(false);
  const [sugItems, setSugItems] = useState<string[]>([]);
  const [sugActive, setSugActive] = useState(0);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const pendingCaret = useRef<number | null>(null);

  const tab = tabLabel ?? (shell === "cmd" ? "Command Prompt" : admin ? "Administrator: PowerShell" : "PowerShell");
  const tabIcon = shell === "cmd" ? "⬛" : "⌨";

  // Autogrow + caret-herstel na een suggestie-completion.
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
    if (pendingCaret.current != null) {
      ta.selectionStart = ta.selectionEnd = pendingCaret.current;
      pendingCaret.current = null;
    }
  }, [input]);

  // Auto-scroll naar onder bij nieuwe output.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [blocks, busy]);

  // ── Suggesties ──────────────────────────────────────────────
  function currentWord(): { word: string; start: number } {
    const ta = taRef.current;
    const caret = ta ? ta.selectionStart : input.length;
    let s = caret;
    while (s > 0 && /[A-Za-z0-9-]/.test(input[s - 1])) s--;
    return { word: input.slice(s, caret), start: s };
  }

  function refreshSuggestions(nextValue: string) {
    const ta = taRef.current;
    const caret = ta ? ta.selectionStart : nextValue.length;
    let s = caret;
    while (s > 0 && /[A-Za-z0-9-]/.test(nextValue[s - 1])) s--;
    const word = nextValue.slice(s, caret);
    if (word.length < 2 || !/[A-Za-z]/.test(word[0])) { setSugOpen(false); return; }
    const matches = completions
      .filter((c) => c.toLowerCase().startsWith(word.toLowerCase()) && c.toLowerCase() !== word.toLowerCase())
      .slice(0, 8);
    setSugItems(matches);
    setSugActive(0);
    setSugOpen(matches.length > 0);
  }

  function acceptSuggestion(idx = sugActive) {
    const pick = sugItems[idx];
    if (!pick) return;
    const { start } = currentWord();
    const ta = taRef.current;
    const caret = ta ? ta.selectionStart : input.length;
    const next = input.slice(0, start) + pick + input.slice(caret);
    pendingCaret.current = start + pick.length;
    setInput(next);
    onChange?.(next);
    setSugOpen(false);
    taRef.current?.focus();
  }

  // ── Submit ──────────────────────────────────────────────────
  async function submit() {
    const command = input;
    const trimmed = command.trim();
    setSugOpen(false);

    if (trimmed) setHistory((h) => [...h, command]);
    histIdx.current = null;

    // Built-in: scherm leegmaken
    if (CLEAR_WORDS.has(trimmed.toLowerCase())) {
      setBlocks([]);
      setInput("");
      onChange?.("");
      return;
    }

    if (!trimmed) {
      // lege regel → enkel een nieuwe prompt tonen
      setBlocks((b) => [...b, { id: nextId.current++, command: "", output: [] }]);
      setInput("");
      return;
    }

    setBusy(true);
    let result: RunResult;
    try {
      result = await onRun(command);
    } catch {
      result = { output: ["Er ging iets mis bij het uitvoeren."], status: "error" };
    }
    setBusy(false);

    if (result.clear) {
      setBlocks(result.output && result.output.length
        ? [{ id: nextId.current++, command: null, output: result.output }]
        : []);
    } else {
      setBlocks((b) => [...b, { id: nextId.current++, command, output: result.output ?? [], status: result.status }]);
    }
    setInput("");
    onChange?.("");
  }

  // ── Toetsen ─────────────────────────────────────────────────
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+L → scherm leegmaken
    if (e.ctrlKey && (e.key === "l" || e.key === "L")) { e.preventDefault(); setBlocks([]); return; }
    // Ctrl+C → huidige regel wissen
    if (e.ctrlKey && (e.key === "c" || e.key === "C") && !window.getSelection()?.toString()) {
      e.preventDefault(); setInput(""); onChange?.(""); setSugOpen(false); return;
    }

    if (sugOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSugActive((i) => (i + 1) % sugItems.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSugActive((i) => (i - 1 + sugItems.length) % sugItems.length); return; }
      if (e.key === "Tab" || (e.key === "Enter" && sugItems.length)) { e.preventDefault(); acceptSuggestion(); return; }
      if (e.key === "Escape") { e.preventDefault(); setSugOpen(false); return; }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const { word } = currentWord();
      if (word.length >= 1) {
        const matches = completions.filter((c) => c.toLowerCase().startsWith(word.toLowerCase()));
        if (matches.length === 1) { acceptFromList(matches[0]); }
        else if (matches.length > 1) { setSugItems(matches.slice(0, 8)); setSugActive(0); setSugOpen(true); }
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); return; }

    if (e.key === "ArrowUp" && !e.shiftKey) {
      if (history.length === 0) return;
      e.preventDefault();
      const idx = histIdx.current === null ? history.length - 1 : Math.max(0, histIdx.current - 1);
      histIdx.current = idx;
      setInput(history[idx]); onChange?.(history[idx]);
      return;
    }
    if (e.key === "ArrowDown" && !e.shiftKey) {
      if (histIdx.current === null) return;
      e.preventDefault();
      const idx = histIdx.current + 1;
      if (idx > history.length - 1) { histIdx.current = null; setInput(""); onChange?.(""); }
      else { histIdx.current = idx; setInput(history[idx]); onChange?.(history[idx]); }
      return;
    }
  }

  function acceptFromList(pick: string) {
    const { start } = currentWord();
    const ta = taRef.current;
    const caret = ta ? ta.selectionStart : input.length;
    const next = input.slice(0, start) + pick + input.slice(caret);
    pendingCaret.current = start + pick.length;
    setInput(next); onChange?.(next); setSugOpen(false);
  }

  return (
    <div className="terminal select-text" onMouseDown={(e) => {
      // Klik in lege ruimte → focus de invoer (maar laat tekstselectie met rust)
      if (!window.getSelection()?.toString()) taRef.current?.focus();
    }}>
      {/* Tab-strip / titlebar */}
      <div className="terminal-bar">
        <span className="terminal-dot" style={{ background: "#ff5f57" }} />
        <span className="terminal-dot" style={{ background: "#febc2e" }} />
        <span className="terminal-dot" style={{ background: "#28c840" }} />
        <span className="terminal-tab ml-2">{tabIcon} {tab}</span>
        <button
          type="button"
          className="ml-auto text-2xs px-2 py-0.5 rounded hover:bg-white/10 text-[color:rgb(var(--term-fg)/0.7)]"
          onClick={(e) => { e.stopPropagation(); setBlocks([]); }}
          title="Scherm leegmaken (Ctrl+L)"
        >
          ⌫ clear
        </button>
      </div>

      {/* Scrollback + live invoer */}
      <div ref={bodyRef} className="terminal-body font-mono">
        {blocks.map((b) => (
          <div key={b.id} className="mb-1">
            {b.command !== null && (
              <div className="whitespace-pre-wrap break-words">
                <TerminalPrompt shell={shell} path={promptPath} admin={admin} />
                <Highlight text={b.command} />
              </div>
            )}
            {b.output.length > 0 && <OutputFormatter lines={b.output} status={b.status} />}
          </div>
        ))}

        {/* Actieve invoerregel */}
        <div className="relative flex items-start">
          <span className="shrink-0">
            <TerminalPrompt shell={shell} path={promptPath} admin={admin} />
          </span>
          <div className="term-input-wrap flex-1 min-w-0">
            <pre className="highlight" aria-hidden>
              {input ? <Highlight text={input} /> : (
                <span className="term-dim">{placeholder ?? ""}</span>
              )}
              {"\n"}
            </pre>
            <textarea
              ref={taRef}
              value={input}
              rows={1}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              disabled={busy}
              aria-label="Typ je commando"
              onChange={(e) => { setInput(e.target.value); onChange?.(e.target.value); refreshSuggestions(e.target.value); histIdx.current = null; }}
              onKeyDown={onKeyDown}
              onBlur={() => setTimeout(() => setSugOpen(false), 120)}
            />

            {sugOpen && sugItems.length > 0 && (
              <div className="term-suggest" style={{ bottom: "100%", left: 0, marginBottom: 4 }}>
                {sugItems.map((s, i) => (
                  <div
                    key={s}
                    className={`term-suggest-item ${i === sugActive ? "active" : ""}`}
                    onMouseDown={(e) => { e.preventDefault(); acceptSuggestion(i); }}
                    onMouseEnter={() => setSugActive(i)}
                  >
                    <span className="tok-cmd">{s}</span>
                    <span className="hint">↹ Tab</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {busy && <div className="term-dim text-2xs mt-1">⏳ uitvoeren…</div>}
      </div>
    </div>
  );
}
