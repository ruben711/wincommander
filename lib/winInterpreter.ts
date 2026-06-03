/**
 * Mini-PowerShell — voert een SUBSET van PowerShell écht uit op mock-data
 * (lib/winMockData.ts). Pipelines, Where/Select/Sort/Measure/ForEach/Group,
 * variabelen, operatoren, member-access, if/for/foreach/while draaien echt.
 * Alles wat niet ondersteund wordt → `Unsupported` → caller valt terug op de
 * pattern-grader. 100% client-side, veilig: er wordt niets op het OS uitgevoerd.
 */
import { mockFor } from "./winMockData";
import { expandAlias } from "./winAliases";

export class Unsupported extends Error {}
class PSError extends Error {}

export type ScriptBlock = { __sb: true; body: Node[] };
export type PSValue = any;

export type RunResult = {
  ok: boolean;
  values: PSValue[];
  lines: string[];
  error?: string;
  unsupported?: boolean;
  format?: "table" | "list";
};

const MAX_ITER = 20000;

// ───────────────────────── LEXER ─────────────────────────
type Tok = { t: string; v: string };
const OPS = new Set([
  "-eq","-ne","-gt","-ge","-lt","-le","-like","-notlike","-match","-notmatch",
  "-contains","-notcontains","-in","-notin","-and","-or","-not","-xor",
  "-replace","-split","-join","-is","-isnot","-as","-band","-bor",
  "-ceq","-cne","-clike","-le","-ge",
]);

function lex(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = src.length;
  const isIdentChar = (c: string) => /[A-Za-z0-9_\\:./*?]/.test(c);
  while (i < n) {
    const c = src[i];
    if (c === "\n") { toks.push({ t: "nl", v: "\n" }); i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "`" && src[i + 1] === "\n") { i += 2; continue; } // line continuation
    if (c === "#") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "<" && src[i + 1] === "#") { i += 2; while (i < n && !(src[i] === "#" && src[i + 1] === ">")) i++; i += 2; continue; }

    // strings
    if (c === "'") { let j = i + 1; let s = ""; while (j < n && src[j] !== "'") { s += src[j]; j++; } toks.push({ t: "str", v: s }); i = j + 1; continue; }
    if (c === '"') { let j = i + 1; let s = ""; while (j < n && src[j] !== '"') { if (src[j] === "`" && j + 1 < n) { s += src[j + 1]; j += 2; continue; } s += src[j]; j++; } toks.push({ t: "dstr", v: s }); i = j + 1; continue; }

    // @( array, @{ hashtable
    if (c === "@" && src[i + 1] === "(") { toks.push({ t: "arrayopen", v: "@(" }); i += 2; continue; }
    if (c === "@" && src[i + 1] === "{") throw new Unsupported("hashtable");

    // variable
    if (c === "$") {
      let j = i + 1; let s = "$";
      if (src[j] === "{") { j++; while (j < n && src[j] !== "}") { s += src[j]; j++; } j++; toks.push({ t: "var", v: s.replace("$", "") }); i = j; continue; }
      while (j < n && /[A-Za-z0-9_:]/.test(src[j])) { s += src[j]; j++; }
      toks.push({ t: "var", v: s.slice(1) }); i = j; continue;
    }

    // numbers (incl. KB/MB/GB suffix) — eet GEEN `..` range op
    if (/[0-9]/.test(c)) {
      let j = i; let s = "";
      while (j < n && /[0-9]/.test(src[j])) { s += src[j]; j++; }
      if (src[j] === "." && /[0-9]/.test(src[j + 1])) { s += "."; j++; while (j < n && /[0-9]/.test(src[j])) { s += src[j]; j++; } }
      let mult = 1;
      const suf = src.slice(j, j + 2).toLowerCase();
      if (suf === "kb") { mult = 1024; j += 2; }
      else if (suf === "mb") { mult = 1048576; j += 2; }
      else if (suf === "gb") { mult = 1073741824; j += 2; }
      else if (suf === "tb") { mult = 1099511627776; j += 2; }
      toks.push({ t: "num", v: String(parseFloat(s) * mult) }); i = j; continue;
    }

    // range ..
    if (c === "." && src[i + 1] === ".") { toks.push({ t: "range", v: ".." }); i += 2; continue; }
    if (c === ".") { toks.push({ t: "dot", v: "." }); i++; continue; }

    if (c === "+" && src[i + 1] === "+") { toks.push({ t: "incr", v: "++" }); i += 2; continue; }
    if (c === "-" && src[i + 1] === "-") { toks.push({ t: "decr", v: "--" }); i += 2; continue; }

    // dash: operator (-eq), param (-Name), or minus
    if (c === "-") {
      let j = i + 1; let w = "-";
      while (j < n && /[A-Za-z]/.test(src[j])) { w += src[j]; j++; }
      if (w.length > 1) {
        if (OPS.has(w.toLowerCase())) toks.push({ t: "op", v: w.toLowerCase() });
        else toks.push({ t: "param", v: w });
        i = j; continue;
      }
      toks.push({ t: "minus", v: "-" }); i++; continue;
    }

    if (c === "|") { toks.push({ t: "pipe", v: "|" }); i++; continue; }
    if (c === "=") { toks.push({ t: "assign", v: "=" }); i++; continue; }
    if (c === "+") { if (src[i + 1] === "=") { toks.push({ t: "pluseq", v: "+=" }); i += 2; } else { toks.push({ t: "plus", v: "+" }); i++; } continue; }
    if (c === "*") { toks.push({ t: "star", v: "*" }); i++; continue; }
    if (c === "/") { toks.push({ t: "slash", v: "/" }); i++; continue; }
    if (c === "%") { toks.push({ t: "percent", v: "%" }); i++; continue; }
    if (c === ";") { toks.push({ t: "semi", v: ";" }); i++; continue; }
    if (c === ",") { toks.push({ t: "comma", v: "," }); i++; continue; }
    if (c === "(") { toks.push({ t: "lparen", v: "(" }); i++; continue; }
    if (c === ")") { toks.push({ t: "rparen", v: ")" }); i++; continue; }
    if (c === "{") { toks.push({ t: "lbrace", v: "{" }); i++; continue; }
    if (c === "}") { toks.push({ t: "rbrace", v: "}" }); i++; continue; }
    if (c === "[") { toks.push({ t: "lbracket", v: "[" }); i++; continue; }
    if (c === "]") { toks.push({ t: "rbracket", v: "]" }); i++; continue; }
    if (c === "$") { i++; continue; }
    if (c === ">" || c === "<" || c === "&") throw new Unsupported("redirect/call-operator");

    // bareword / cmdlet / path
    if (isIdentChar(c)) {
      let j = i; let s = "";
      while (j < n) {
        const ch = src[j];
        if (isIdentChar(ch)) { s += ch; j++; continue; }
        if (ch === "-" && j + 1 < n && /[A-Za-z]/.test(src[j + 1])) { s += ch; j++; continue; }
        break;
      }
      toks.push({ t: "ident", v: s }); i = j; continue;
    }
    throw new Unsupported("teken: " + c);
  }
  toks.push({ t: "eof", v: "" });
  return toks;
}

// ───────────────────────── PARSER ─────────────────────────
type Node = any;

class Parser {
  toks: Tok[]; p = 0;
  constructor(toks: Tok[]) { this.toks = toks; }
  peek(o = 0) { return this.toks[this.p + o]; }
  next() { return this.toks[this.p++]; }
  eat(t: string) { if (this.peek().t !== t) throw new Unsupported(`verwacht ${t}, kreeg ${this.peek().t}`); return this.next(); }
  skipNL() { while (this.peek().t === "nl" || this.peek().t === "semi") this.next(); }

  parseProgram(): Node[] {
    const stmts: Node[] = [];
    this.skipNL();
    while (this.peek().t !== "eof") {
      stmts.push(this.parseStatement());
      if (this.peek().t === "nl" || this.peek().t === "semi") this.skipNL();
      else break;
    }
    return stmts;
  }

  parseBlock(): Node[] {
    this.eat("lbrace");
    const stmts: Node[] = [];
    this.skipNL();
    while (this.peek().t !== "rbrace" && this.peek().t !== "eof") {
      stmts.push(this.parseStatement());
      this.skipNL();
    }
    this.eat("rbrace");
    return stmts;
  }

  parseStatement(): Node {
    const tk = this.peek();
    if (tk.t === "ident") {
      const kw = tk.v.toLowerCase();
      if (kw === "if") return this.parseIf();
      if (kw === "foreach" && this.peek(1).t === "lparen") return this.parseForeach();
      if (kw === "for") return this.parseFor();
      if (kw === "while") return this.parseWhile();
      if (kw === "do") return this.parseDo();
      if (kw === "switch" || kw === "function" || kw === "try" || kw === "param") throw new Unsupported(kw);
    }
    // increment/decrement: $i++  /  $i--
    if (tk.t === "var" && (this.peek(1).t === "incr" || this.peek(1).t === "decr")) {
      const name = this.next().v; const d = this.next().t;
      return { k: "assign", name, op: "assign", value: { k: "bin", op: d === "incr" ? "+" : "-", left: { k: "var", name }, right: { k: "lit", v: 1 } } };
    }
    // assignment: $x = ...  /  $x += ...
    if (tk.t === "var" && (this.peek(1).t === "assign" || this.peek(1).t === "pluseq")) {
      const name = this.next().v;
      const op = this.next().t;
      const value = this.parsePipeline();
      return { k: "assign", name, op, value };
    }
    return this.parsePipeline();
  }

  parseIf(): Node {
    this.next(); // if
    this.eat("lparen"); const cond = this.parseExpr(); this.eat("rparen");
    const then = this.parseBlock();
    const elifs: any[] = []; let els: Node[] | null = null;
    this.skipNLInline();
    while (this.peek().t === "ident" && this.peek().v.toLowerCase() === "elseif") {
      this.next(); this.eat("lparen"); const c = this.parseExpr(); this.eat("rparen");
      elifs.push({ cond: c, body: this.parseBlock() }); this.skipNLInline();
    }
    if (this.peek().t === "ident" && this.peek().v.toLowerCase() === "else") { this.next(); els = this.parseBlock(); }
    return { k: "if", cond, then, elifs, els };
  }
  skipNLInline() { while (this.peek().t === "nl") this.next(); }

  parseForeach(): Node {
    this.next(); this.eat("lparen");
    const varTok = this.eat("var");
    const inTok = this.eat("ident"); if (inTok.v.toLowerCase() !== "in") throw new Unsupported("foreach in");
    const coll = this.parseExpr(); this.eat("rparen");
    return { k: "foreach", varName: varTok.v, coll, body: this.parseBlock() };
  }
  parseFor(): Node {
    this.next(); this.eat("lparen");
    const init = this.peek().t === "semi" ? null : this.parseStatement(); this.eat("semi");
    const cond = this.peek().t === "semi" ? null : this.parseExpr(); this.eat("semi");
    const iter = this.peek().t === "rparen" ? null : this.parseStatement(); this.eat("rparen");
    return { k: "for", init, cond, iter, body: this.parseBlock() };
  }
  parseWhile(): Node { this.next(); this.eat("lparen"); const cond = this.parseExpr(); this.eat("rparen"); return { k: "while", cond, body: this.parseBlock() }; }
  parseDo(): Node {
    this.next(); const body = this.parseBlock(); this.skipNLInline();
    const kw = this.eat("ident").v.toLowerCase(); if (kw !== "while" && kw !== "until") throw new Unsupported("do");
    this.eat("lparen"); const cond = this.parseExpr(); this.eat("rparen");
    return { k: "do", body, cond, until: kw === "until" };
  }

  parsePipeline(): Node {
    const stages = [this.parseStage()];
    while (this.peek().t === "pipe") { this.next(); this.skipNLInline(); stages.push(this.parseStage()); }
    return stages.length === 1 ? stages[0] : { k: "pipe", stages };
  }

  // stage = command (start met ident) of expressie
  parseStage(): Node {
    if (this.peek().t === "ident") return this.parseCommand();
    return { k: "exprstmt", expr: this.parseExpr() };
  }

  isStageEnd() { return ["pipe", "semi", "nl", "eof", "rparen", "rbrace", "rbracket"].includes(this.peek().t); }

  parseCommand(): Node {
    const name = this.next().v;
    const args: any[] = [];
    while (!this.isStageEnd()) {
      const tk = this.peek();
      if (tk.t === "lbrace") { args.push({ kind: "sb", node: { k: "scriptblock", body: this.parseBlock() } }); continue; }
      if (tk.t === "op") { this.next(); args.push({ kind: "op", op: tk.v }); continue; }
      if (tk.t === "param") {
        this.next();
        // waarde? alleen als volgende token een waarde-start is (geen param/op/pipe/end)
        const nt = this.peek().t;
        const valueStart = ["num", "str", "dstr", "var", "ident", "lparen", "arrayopen", "minus", "lbracket"].includes(nt);
        if (valueStart) args.push({ kind: "param", name: tk.v.slice(1), value: this.parseArgExpr() });
        else args.push({ kind: "switch", name: tk.v.slice(1) });
        continue;
      }
      // positioneel argument (bareword ident wordt string-literal via parsePrimary)
      args.push({ kind: "value", node: this.parseArgExpr() });
    }
    return { k: "cmd", name, args };
  }

  // cmdlet-argument: arithmetic/range/komma-array, maar GEEN -operatoren of logica
  // (zodat 'Where-Object Status -eq Running' het -eq als los argument ziet).
  parseArgExpr(): Node {
    let left = this.parseRange();
    if (this.peek().t === "comma") {
      const items = [left];
      while (this.peek().t === "comma") { this.next(); this.skipNLInline(); items.push(this.parseRange()); }
      return { k: "array", items };
    }
    return left;
  }

  // ── expressies (precedentie) ──
  parseExpr(): Node { return this.parseArray(); }
  parseArray(): Node {
    let left = this.parseLogic();
    if (this.peek().t === "comma") {
      const items = [left];
      while (this.peek().t === "comma") { this.next(); this.skipNLInline(); items.push(this.parseLogic()); }
      return { k: "array", items };
    }
    return left;
  }
  parseLogic(): Node {
    let left = this.parseCompare();
    while (this.peek().t === "op" && ["-and", "-or", "-xor"].includes(this.peek().v)) {
      const op = this.next().v; const right = this.parseCompare(); left = { k: "bin", op, left, right };
    }
    return left;
  }
  parseCompare(): Node {
    let left = this.parseRange();
    while (this.peek().t === "op" && !["-and", "-or", "-xor", "-not"].includes(this.peek().v)) {
      const op = this.next().v; const right = this.parseRange(); left = { k: "bin", op, left, right };
    }
    return left;
  }
  parseRange(): Node {
    let left = this.parseAdd();
    if (this.peek().t === "range") { this.next(); const right = this.parseAdd(); return { k: "range", left, right }; }
    return left;
  }
  parseAdd(): Node {
    let left = this.parseMul();
    while (this.peek().t === "plus" || this.peek().t === "minus") { const op = this.next().v; const right = this.parseMul(); left = { k: "bin", op, left, right }; }
    return left;
  }
  parseMul(): Node {
    let left = this.parseUnary();
    while (["star", "slash", "percent"].includes(this.peek().t)) { const op = this.next().v; const right = this.parseUnary(); left = { k: "bin", op, left, right }; }
    return left;
  }
  parseUnary(): Node {
    if (this.peek().t === "minus") { this.next(); return { k: "neg", node: this.parseUnary() }; }
    if (this.peek().t === "op" && this.peek().v === "-not") { this.next(); return { k: "not", node: this.parseUnary() }; }
    return this.parsePostfix();
  }
  parsePostfix(): Node {
    let node = this.parsePrimary();
    while (true) {
      if (this.peek().t === "dot") {
        this.next();
        const nameTok = this.next(); const name = nameTok.v;
        if (this.peek().t === "lparen") { // method call
          this.next(); const argz: Node[] = [];
          if (this.peek().t !== "rparen") { argz.push(this.parseLogic()); while (this.peek().t === "comma") { this.next(); argz.push(this.parseLogic()); } }
          this.eat("rparen"); node = { k: "method", target: node, name, args: argz };
        } else node = { k: "member", target: node, name };
      } else if (this.peek().t === "lbracket") {
        this.next(); const idx = this.parseLogic(); this.eat("rbracket"); node = { k: "index", target: node, idx };
      } else break;
    }
    return node;
  }
  parsePrimary(): Node {
    const tk = this.peek();
    if (tk.t === "num") { this.next(); return { k: "lit", v: parseFloat(tk.v) }; }
    if (tk.t === "str") { this.next(); return { k: "lit", v: tk.v }; }
    if (tk.t === "dstr") { this.next(); return { k: "dstr", v: tk.v }; }
    if (tk.t === "var") { this.next(); return { k: "var", name: tk.v }; }
    if (tk.t === "ident") {
      const lv = tk.v.toLowerCase();
      if (lv === "true" || lv === "false") { this.next(); return { k: "lit", v: lv === "true" }; }
      if (lv === "null") { this.next(); return { k: "lit", v: null }; }
      this.next(); return { k: "lit", v: tk.v }; // bareword als string
    }
    if (tk.t === "lparen") { this.next(); const e = this.parsePipeline(); this.eat("rparen"); return e; }
    if (tk.t === "arrayopen") { this.next(); this.skipNLInline(); const items: Node[] = []; if (this.peek().t !== "rparen") { items.push(this.parsePipeline()); while (this.peek().t === "comma" || this.peek().t === "nl" || this.peek().t === "semi") { this.next(); this.skipNLInline(); if (this.peek().t === "rparen") break; items.push(this.parsePipeline()); } } this.eat("rparen"); return { k: "arraylit", items }; }
    if (tk.t === "lbrace") return { k: "scriptblock", body: this.parseBlock() };
    if (tk.t === "lbracket") throw new Unsupported("type-literal");
    throw new Unsupported("expressie bij " + tk.t);
  }
}

// ───────────────────────── EVALUATOR ─────────────────────────
type Env = { vars: Record<string, PSValue>; out: PSValue[]; iter: { n: number } };

function truthy(v: PSValue): boolean {
  if (Array.isArray(v)) return v.length > 0 && !(v.length === 1 && !truthy(v[0]));
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.length > 0;
  if (typeof v === "number") return v !== 0;
  return !!v;
}
function asNum(v: PSValue): number { const n = typeof v === "number" ? v : parseFloat(v); if (isNaN(n)) throw new PSError("geen getal"); return n; }
function flat(v: PSValue): PSValue[] { return Array.isArray(v) ? v.flat(Infinity) : [v]; }

function envGet(env: Env, name: string): PSValue {
  if (name === "true") return true; if (name === "false") return false; if (name === "null") return null;
  if (name.toLowerCase().startsWith("env:")) {
    const k = name.slice(4).toLowerCase();
    const mock: Record<string, string> = { username: "Ruben", userdomain: "WINCMD-PC", computername: "WINCMD-PC", userprofile: "C:\\Users\\Ruben", os: "Windows_NT" };
    return mock[k] ?? "";
  }
  return name in env.vars ? env.vars[name] : null;
}

function wildcard(pattern: string, s: string): boolean {
  const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
  return re.test(s);
}

function compare(op: string, l: PSValue, r: PSValue): PSValue {
  // array aan de linkerkant => filter (PowerShell-gedrag)
  if (Array.isArray(l) && !["-contains", "-notcontains", "-in", "-notin"].includes(op)) {
    return l.filter((x) => truthy(compare(op, x, r)));
  }
  const bothNum = typeof l === "number" && typeof r === "number";
  const ls = String(l).toLowerCase(), rs = String(r).toLowerCase();
  switch (op) {
    case "-eq": case "-ceq": return bothNum ? l === r : ls === rs;
    case "-ne": case "-cne": return bothNum ? l !== r : ls !== rs;
    case "-gt": return bothNum ? l > r : ls > rs;
    case "-ge": return bothNum ? l >= r : ls >= rs;
    case "-lt": return bothNum ? l < r : ls < rs;
    case "-le": return bothNum ? l <= r : ls <= rs;
    case "-like": return wildcard(String(r), String(l));
    case "-notlike": return !wildcard(String(r), String(l));
    case "-match": return new RegExp(String(r), "i").test(String(l));
    case "-notmatch": return !new RegExp(String(r), "i").test(String(l));
    case "-contains": return flat(l).some((x) => String(x).toLowerCase() === rs);
    case "-notcontains": return !flat(l).some((x) => String(x).toLowerCase() === rs);
    case "-in": return flat(r).some((x) => String(x).toLowerCase() === ls);
    case "-notin": return !flat(r).some((x) => String(x).toLowerCase() === ls);
    case "-replace": return String(l).replace(new RegExp(String(r), "gi"), "");
    case "-split": return String(l).split(new RegExp(String(r)));
    case "-join": return flat(l).join(String(r));
    default: throw new Unsupported("operator " + op);
  }
}

function evalExpr(node: Node, env: Env, dollar?: PSValue): PSValue {
  switch (node.k) {
    case "lit": return node.v;
    case "dstr": return interpolate(node.v, env, dollar);
    case "var": return node.name === "_" ? dollar : envGet(env, node.name);
    case "array": return node.items.map((it: Node) => evalExpr(it, env, dollar));
    case "arraylit": return node.items.map((it: Node) => runStmtValue(it, env, dollar)).flat();
    case "range": { const a = asNum(evalExpr(node.left, env, dollar)), b = asNum(evalExpr(node.right, env, dollar)); const out = []; if (a <= b) for (let x = a; x <= b; x++) out.push(x); else for (let x = a; x >= b; x--) out.push(x); return out; }
    case "neg": return -asNum(evalExpr(node.node, env, dollar));
    case "not": return !truthy(evalExpr(node.node, env, dollar));
    case "bin": {
      const l = evalExpr(node.left, env, dollar);
      if (node.op === "-and") return truthy(l) ? truthy(evalExpr(node.right, env, dollar)) : false;
      if (node.op === "-or") return truthy(l) ? true : truthy(evalExpr(node.right, env, dollar));
      const r = evalExpr(node.right, env, dollar);
      if (node.op === "+") { if (Array.isArray(l)) return [...l, ...(Array.isArray(r) ? r : [r])]; if (typeof l === "string" || typeof r === "string") return String(l) + String(r); return asNum(l) + asNum(r); }
      if (node.op === "-") return asNum(l) - asNum(r);
      if (node.op === "*") { if (typeof l === "string") return l.repeat(asNum(r)); return asNum(l) * asNum(r); }
      if (node.op === "/") return asNum(l) / asNum(r);
      if (node.op === "%") return asNum(l) % asNum(r);
      return compare(node.op, l, r);
    }
    case "member": {
      const t = evalExpr(node.target, env, dollar); const m = node.name;
      return memberAccess(t, m);
    }
    case "method": {
      const t = evalExpr(node.target, env, dollar);
      const a = node.args.map((x: Node) => evalExpr(x, env, dollar));
      return methodCall(t, node.name, a);
    }
    case "index": { const t = evalExpr(node.target, env, dollar); const i = asNum(evalExpr(node.idx, env, dollar)); const arr = flat(t); return arr[i < 0 ? arr.length + i : i]; }
    case "scriptblock": return { __sb: true, body: node.body } as ScriptBlock;
    case "pipe": case "cmd": case "exprstmt": return runStmtValue(node, env, dollar);
    default: throw new Unsupported("node " + node.k);
  }
}

function interpolate(s: string, env: Env, dollar?: PSValue): string {
  return s.replace(/\$\(([^)]*)\)/g, (_, expr) => { try { return formatScalar(runProgram(expr, env, dollar)); } catch { return ""; } })
          .replace(/\$(\w[\w:]*)/g, (_, name) => formatScalar(name === "_" ? dollar : envGet(env, name)))
          .replace(/\$\{([^}]+)\}/g, (_, name) => formatScalar(envGet(env, name)));
}
function runProgram(src: string, env: Env, dollar?: PSValue): PSValue { const p = new Parser(lex(src)).parseProgram(); let last: PSValue = ""; for (const st of p) last = runStmtValue(st, env, dollar); return last; }

function memberAccess(t: PSValue, m: string): PSValue {
  if (Array.isArray(t)) { if (m.toLowerCase() === "count" || m.toLowerCase() === "length") return t.length; return t.map((x) => memberAccess(x, m)); }
  if (typeof t === "string") { if (m.toLowerCase() === "length") return t.length; }
  if (t && typeof t === "object") {
    const key = Object.keys(t).find((k) => k.toLowerCase() === m.toLowerCase());
    if (key) return t[key];
    if (m.toLowerCase() === "count") return 1;
    return null;
  }
  return null;
}
function methodCall(t: PSValue, name: string, a: PSValue[]): PSValue {
  const m = name.toLowerCase();
  if (typeof t === "string") {
    if (m === "toupper") return t.toUpperCase();
    if (m === "tolower") return t.toLowerCase();
    if (m === "trim") return t.trim();
    if (m === "substring") return a.length > 1 ? t.substr(asNum(a[0]), asNum(a[1])) : t.substring(asNum(a[0]));
    if (m === "replace") return t.split(String(a[0])).join(String(a[1]));
    if (m === "split") return t.split(String(a[0]));
    if (m === "contains") return t.toLowerCase().includes(String(a[0]).toLowerCase());
    if (m === "startswith") return t.toLowerCase().startsWith(String(a[0]).toLowerCase());
    if (m === "padleft") return t.padStart(asNum(a[0]));
    if (m === "gettype") return { Name: "String", BaseType: "System.Object", FullName: "System.String" };
  }
  if (typeof t === "number" && m === "gettype") return { Name: Number.isInteger(t) ? "Int32" : "Double", FullName: "System.Int32" };
  if (Array.isArray(t)) { if (m === "count") return t.length; }
  if (m === "tostring") return formatScalar(t);
  throw new Unsupported("methode ." + name);
}

// statements die output produceren
function runStmtValue(node: Node, env: Env, dollar?: PSValue): PSValue {
  switch (node.k) {
    case "assign": {
      let val = runStmtValue(node.value, env, dollar);
      if (Array.isArray(val) && val.length === 1) val = val[0];
      if (node.op === "pluseq") { const cur = envGet(env, node.name); val = Array.isArray(cur) ? [...cur, val] : (typeof cur === "number" ? cur + asNum(val) : String(cur ?? "") + String(val)); }
      env.vars[node.name] = val;
      return [];
    }
    case "exprstmt": return evalExpr(node.expr, env, dollar);
    case "pipe": return runPipeline(node.stages, env, dollar);
    case "cmd": return runCommand(node, env, dollar, null);
    case "if": {
      if (truthy(evalExpr(node.cond, env, dollar))) return runBlock(node.then, env, dollar);
      for (const e of node.elifs) if (truthy(evalExpr(e.cond, env, dollar))) return runBlock(e.body, env, dollar);
      if (node.els) return runBlock(node.els, env, dollar);
      return [];
    }
    case "foreach": {
      const coll = flat(evalExpr(node.coll, env, dollar)); const out: PSValue[] = [];
      for (const item of coll) { env.vars[node.varName] = item; if (++env.iter.n > MAX_ITER) throw new Unsupported("te veel iteraties"); const r = runBlock(node.body, env, dollar); if (r.length) out.push(...r); }
      return out;
    }
    case "for": {
      const out: PSValue[] = []; if (node.init) runStmtValue(node.init, env, dollar);
      while (node.cond ? truthy(evalExpr(node.cond, env, dollar)) : true) { if (++env.iter.n > MAX_ITER) throw new Unsupported("te veel iteraties"); const r = runBlock(node.body, env, dollar); if (r.length) out.push(...r); if (node.iter) runStmtValue(node.iter, env, dollar); }
      return out;
    }
    case "while": {
      const out: PSValue[] = []; while (truthy(evalExpr(node.cond, env, dollar))) { if (++env.iter.n > MAX_ITER) throw new Unsupported("oneindige lus"); const r = runBlock(node.body, env, dollar); if (r.length) out.push(...r); } return out;
    }
    case "do": {
      const out: PSValue[] = []; do { if (++env.iter.n > MAX_ITER) throw new Unsupported("oneindige lus"); const r = runBlock(node.body, env, dollar); if (r.length) out.push(...r); } while (node.until ? !truthy(evalExpr(node.cond, env, dollar)) : truthy(evalExpr(node.cond, env, dollar))); return out;
    }
    default: return evalExpr(node, env, dollar);
  }
}
function runBlock(stmts: Node[], env: Env, dollar?: PSValue): PSValue[] {
  const out: PSValue[] = [];
  for (const st of stmts) { const r = runStmtValue(st, env, dollar); if (st.k === "assign") continue; if (r !== undefined && r !== null && !(Array.isArray(r) && r.length === 0)) out.push(...(Array.isArray(r) ? r : [r])); }
  return out;
}

// ── pipeline ──
function runPipeline(stages: Node[], env: Env, dollar?: PSValue): PSValue {
  let input: PSValue[] | null = null;
  for (const stage of stages) {
    if (stage.k === "cmd") input = flat(runCommand(stage, env, dollar, input));
    else { const v = evalExpr(stage.expr ?? stage, env, dollar); input = flat(v); }
  }
  return input ?? [];
}

function argVals(args: any[], env: Env, dollar?: PSValue) {
  const params: Record<string, PSValue> = {}; const switches = new Set<string>(); const positional: PSValue[] = []; const sbs: ScriptBlock[] = []; const ops: string[] = [];
  for (const a of args) {
    if (a.kind === "param") params[a.name.toLowerCase()] = evalExpr(a.value, env, dollar);
    else if (a.kind === "switch") switches.add(a.name.toLowerCase());
    else if (a.kind === "sb") sbs.push({ __sb: true, body: a.node.body });
    else if (a.kind === "op") ops.push(a.op);
    else positional.push(evalExpr(a.node, env, dollar));
  }
  return { params, switches, positional, sbs, ops, raw: args };
}

function runCommand(node: Node, env: Env, dollar: PSValue, input: PSValue[] | null): PSValue {
  const name = expandAlias(node.name);
  const A = argVals(node.args, env, dollar);
  const IN = input ?? [];

  switch (name) {
    case "get-service": case "get-process": case "get-childitem": case "get-localuser": {
      let data = mockFor(name)!;
      const nameFilter = A.params["name"] ?? A.positional[0];
      if (nameFilter != null) data = data.filter((o: any) => wildcard(String(nameFilter), String(o.Name)));
      return data;
    }
    case "get-ciminstance": case "get-wmiobject": {
      const cls = String(A.params["classname"] ?? A.params["class"] ?? A.positional[0] ?? "");
      const data = mockFor(name, cls); if (!data) throw new Unsupported("WMI-klasse " + cls); return data;
    }
    case "where-object": {
      if (A.sbs.length) return IN.filter((item) => truthy(runBlock(A.sbs[0].body, env, item)[0] ?? runScriptValue(A.sbs[0], env, item)));
      // shorthand: <Prop> <-op> <value>
      const prop = String(A.positional[0]); const op = A.ops[0]; const val = A.positional[1];
      if (!op) throw new Unsupported("where-object vorm");
      return IN.filter((item) => truthy(compare(op, item?.[findKey(item, prop)] ?? null, val)));
    }
    case "foreach-object": {
      if (!A.sbs.length) throw new Unsupported("foreach-object zonder scriptblok");
      const out: PSValue[] = []; for (const item of IN) { const r = runBlock(A.sbs[0].body, env, item); out.push(...r); } return out;
    }
    case "select-object": {
      let items = IN.slice();
      if (A.params["first"] != null) items = items.slice(0, asNum(A.params["first"]));
      if (A.params["last"] != null) items = items.slice(-asNum(A.params["last"]));
      if (A.params["skip"] != null) items = items.slice(asNum(A.params["skip"]));
      const exp = A.params["expandproperty"]; if (exp != null) return items.map((it) => it?.[findKey(it, String(exp))]);
      let props: string[] = [];
      if (A.params["property"] != null) props = flat(A.params["property"]).map(String);
      else if (A.positional.length) props = A.positional.flatMap((p) => Array.isArray(p) ? p.map(String) : [String(p)]);
      if (A.switches.has("unique")) { const seen = new Set(); items = items.filter((it) => { const key = JSON.stringify(it); if (seen.has(key)) return false; seen.add(key); return true; }); }
      if (props.length) return items.map((it) => { const o: any = {}; for (const p of props) o[p] = it?.[findKey(it, p)]; return o; });
      return items;
    }
    case "sort-object": {
      const items = IN.slice();
      const props = A.params["property"] != null ? flat(A.params["property"]).map(String) : A.positional.map(String);
      const desc = A.switches.has("descending") || A.ops.includes("-descending");
      items.sort((a, b) => { for (const p of (props.length ? props : [null])) { const av = p ? a?.[findKey(a, p)] : a; const bv = p ? b?.[findKey(b, p)] : b; const c = cmpVal(av, bv); if (c) return desc ? -c : c; } return 0; });
      if (A.switches.has("unique")) { const seen = new Set(); return items.filter((it) => { const k = JSON.stringify(it); if (seen.has(k)) return false; seen.add(k); return true; }); }
      return items;
    }
    case "measure-object": {
      const prop = A.params["property"] != null ? String(flat(A.params["property"])[0]) : (A.positional[0] != null ? String(A.positional[0]) : null);
      const nums = prop ? IN.map((it) => Number(it?.[findKey(it, prop)])).filter((x) => !isNaN(x)) : [];
      const o: any = { Count: IN.length };
      if (A.switches.has("sum")) o.Sum = nums.reduce((s, x) => s + x, 0);
      if (A.switches.has("average")) o.Average = nums.length ? nums.reduce((s, x) => s + x, 0) / nums.length : 0;
      if (A.switches.has("maximum")) o.Maximum = nums.length ? Math.max(...nums) : null;
      if (A.switches.has("minimum")) o.Minimum = nums.length ? Math.min(...nums) : null;
      if (prop) o.Property = prop;
      return o;
    }
    case "group-object": {
      const prop = A.params["property"] != null ? String(flat(A.params["property"])[0]) : String(A.positional[0]);
      const map = new Map<string, any[]>();
      for (const it of IN) { const key = String(it?.[findKey(it, prop)]); if (!map.has(key)) map.set(key, []); map.get(key)!.push(it); }
      return [...map.entries()].map(([Name, Group]) => ({ Count: Group.length, Name, Group }));
    }
    case "measure": return runCommand({ ...node, name: "measure-object" }, env, dollar, input);
    case "write-output": case "write-host": return A.positional.length ? A.positional : IN;
    case "select-string": { const pat = String(A.params["pattern"] ?? A.positional[0]); return IN.filter((it) => new RegExp(pat, "i").test(String(it))); }
    case "format-table": case "format-list": case "format-wide": {
      let items = IN;
      const props = A.params["property"] != null ? flat(A.params["property"]).map(String) : A.positional.map(String);
      if (props.length) items = items.map((it) => { const o: any = {}; for (const p of props) o[p] = it?.[findKey(it, p)]; return o; });
      (items as any).__format = name === "format-list" ? "list" : "table";
      return items;
    }
    case "get-date": return { __date: true, Year: 2026, Month: 6, Day: 3, Hour: 14, Minute: 22, Second: 0, DayOfWeek: "Wednesday", Date: "3/06/2026 0:00:00" };
    case "get-random": { const max = A.params["maximum"] != null ? asNum(A.params["maximum"]) : 100; return Math.floor((max * 0.42)); }
    case "measure-command": throw new Unsupported(name);
    default: throw new Unsupported("cmdlet " + node.name);
  }
}
function runScriptValue(sb: ScriptBlock, env: Env, dollar: PSValue): PSValue { const r = runBlock(sb.body, env, dollar); return r[r.length - 1]; }
function findKey(o: any, p: string): string { if (!o || typeof o !== "object") return p; return Object.keys(o).find((k) => k.toLowerCase() === p.toLowerCase()) ?? p; }
function cmpVal(a: PSValue, b: PSValue): number { if (typeof a === "number" && typeof b === "number") return a - b; return String(a).toLowerCase() < String(b).toLowerCase() ? -1 : String(a).toLowerCase() > String(b).toLowerCase() ? 1 : 0; }

// ───────────────────────── FORMATTER ─────────────────────────
function formatScalar(v: PSValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  if (v && typeof v === "object" && v.__date) return `${v.DayOfWeek} 3 juni 2026 ${v.Hour}:${v.Minute}:00`;
  if (typeof v === "string") return v;
  return String(v);
}

export function formatValues(values: PSValue[]): string[] {
  const items = values.filter((v) => v !== undefined && !(v && (v as any).__sb));
  if (items.length === 0) return [];
  const objs = items.filter((v) => v && typeof v === "object" && !Array.isArray(v) && !v.__date);
  const allObj = objs.length === items.length && items.length > 0;
  if (!allObj) return items.map(formatScalar);

  const fmt = (values as any).__format;
  const cols = Object.keys(items[0]).filter((k) => !k.startsWith("__") && k !== "Group");
  if (fmt === "list" || cols.length > 5) {
    const out: string[] = [];
    for (const o of items) { out.push(""); for (const c of cols) out.push(`${c} : ${formatScalar((o as any)[c])}`); }
    out.push(""); return out;
  }
  // tabel
  const widths = cols.map((c) => Math.max(c.length, ...items.map((o) => formatScalar((o as any)[c]).length)));
  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));
  const out: string[] = [""];
  out.push(cols.map((c, i) => pad(c, widths[i])).join("  "));
  out.push(cols.map((_, i) => "-".repeat(widths[i])).join("  "));
  for (const o of items) out.push(cols.map((c, i) => pad(formatScalar((o as any)[c]), widths[i])).join("  "));
  return out;
}

// ───────────────────────── PUBLIC API ─────────────────────────
export function run(src: string): RunResult {
  try {
    const stmts = new Parser(lex(src)).parseProgram();
    const env: Env = { vars: {}, out: [], iter: { n: 0 } };
    let values: PSValue[] = [];
    for (const st of stmts) {
      const r = runStmtValue(st, env);
      if (st.k === "assign") continue;
      if (r !== undefined && r !== null && !(Array.isArray(r) && r.length === 0)) values = Array.isArray(r) ? r : [r];
    }
    const flatVals: PSValue[] = Array.isArray(values) ? (values as any[]).flat(Infinity) : [values];
    (flatVals as any).__format = (values as any).__format;
    return { ok: true, values: flatVals, lines: formatValues(flatVals) };
  } catch (e: any) {
    if (e instanceof Unsupported) return { ok: false, values: [], lines: [], unsupported: true };
    return { ok: false, values: [], lines: [], error: e?.message || "fout" };
  }
}

/** Vergelijkt de uitvoer van twee commando's (voor output-gebaseerde grading). */
export function sameOutput(a: string, b: string): boolean {
  const ra = run(a), rb = run(b);
  if (!ra.ok || !rb.ok) return false;
  const norm = (vals: PSValue[]) => JSON.stringify(vals.map((v) => (v && typeof v === "object" ? sortKeys(v) : v)));
  return norm(ra.values) === norm(rb.values) && ra.values.length > 0;
}
function sortKeys(o: any): any { if (Array.isArray(o)) return o.map(sortKeys); if (o && typeof o === "object") { const r: any = {}; for (const k of Object.keys(o).filter((k) => !k.startsWith("__")).sort()) r[k] = sortKeys(o[k]); return r; } return o; }
