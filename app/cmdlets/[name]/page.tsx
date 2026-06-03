"use client";
import Link from "next/link";
import Highlight from "@/components/Highlight";
import { getCmdlet, exerciseForCmdlet } from "@/lib/cmdlets";

export default function CmdletDetail({ params }: { params: { name: string } }) {
  const c = getCmdlet(params.name);

  if (!c) {
    return (
      <div className="empty-state">
        <span className="text-3xl">🤷</span>
        <p>Cmdlet <code className="font-mono">{decodeURIComponent(params.name)}</code> niet gevonden.</p>
        <Link href="/cmdlets" className="btn mt-2">Terug naar bibliotheek</Link>
      </div>
    );
  }

  const test = exerciseForCmdlet(c.name);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="text-2xs text-fg-dim">
        <Link href="/cmdlets" className="hover:text-brand">Cmdlet-bibliotheek</Link>
        {c.chapter && <><span className="mx-1.5">/</span><span>{c.chapter}</span></>}
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-mono font-semibold text-brand">{c.name}</h1>
          <p className="mt-1 text-[15px] text-fg-muted">{c.summary}</p>
          {c.aliases && c.aliases.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-2xs text-fg-dim">alias:</span>
              {c.aliases.map((a) => <code key={a} className="chip font-mono">{a}</code>)}
            </div>
          )}
        </div>
        {test && <Link href={`/oefeningen/${test.id}`} className="btn-primary shrink-0">▸ Test mij</Link>}
      </div>

      {c.description && <p className="text-[14px] leading-relaxed">{c.description}</p>}

      {c.syntax && (
        <section>
          <h2 className="section-title mb-2">Syntax</h2>
          <pre className="code"><Highlight text={c.syntax} /></pre>
        </section>
      )}

      {c.parameters && c.parameters.length > 0 && (
        <section>
          <h2 className="section-title mb-2">Parameters</h2>
          <div className="card overflow-hidden">
            {c.parameters.map((p, i) => (
              <div key={p.name} className={`flex gap-3 px-3 py-2 text-[13px] ${i > 0 ? "border-t border-line" : ""}`}>
                <code className="font-mono text-tok-param shrink-0 w-40" style={{ color: "rgb(var(--brand))" }}>{p.name}</code>
                <span className="text-fg-muted">{p.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {c.examples && c.examples.length > 0 && (
        <section>
          <h2 className="section-title mb-2">Voorbeelden</h2>
          <div className="space-y-3">
            {c.examples.map((ex, i) => (
              <div key={i}>
                {ex.desc && <p className="text-2xs text-fg-muted mb-1">{ex.desc}</p>}
                <pre className="code"><span className="term-prompt-ps">PS&gt; </span><Highlight text={ex.cmd} /></pre>
              </div>
            ))}
          </div>
        </section>
      )}

      {c.related && c.related.length > 0 && (
        <section>
          <h2 className="section-title mb-2">Verwant</h2>
          <div className="flex flex-wrap gap-2">
            {c.related.map((r) => (
              <Link key={r} href={`/cmdlets/${encodeURIComponent(r)}`} className="chip-brand font-mono hover:underline">{r}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
