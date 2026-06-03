import { tokenize, type HTokenType } from "@/lib/winHighlight";

const CLASS: Record<HTokenType, string> = {
  cmd: "tok-cmd",
  param: "tok-param",
  string: "tok-string",
  comment: "tok-comment",
  var: "tok-var",
  num: "tok-num",
  op: "tok-op",
  prop: "tok-prop",
  plain: "tok-plain",
};

/** Rendert een PowerShell-/CMD-commando met syntax-highlighting (spans). */
export default function Highlight({ text }: { text: string }) {
  const tokens = tokenize(text);
  return (
    <>
      {tokens.map((tok, i) => (
        <span key={i} className={CLASS[tok.t]}>{tok.v}</span>
      ))}
    </>
  );
}
