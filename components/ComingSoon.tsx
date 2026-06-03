import Link from "next/link";

export default function ComingSoon({
  title,
  emoji,
  lead,
  bullets,
}: {
  title: string;
  emoji: string;
  lead: string;
  bullets?: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{emoji}</span>
        <h1 className="text-xl font-semibold">{title}</h1>
        <span className="chip ml-1">in aanbouw</span>
      </div>
      <div className="card card-pad">
        <p className="text-fg-muted">{lead}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-4 space-y-2 text-[13px]">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand mt-0.5">▸</span>
                <span className="text-fg-muted">{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex gap-2">
          <Link href="/oefeningen" className="btn-primary">Naar de oefeningen</Link>
          <Link href="/dashboard" className="btn">Naar dashboard</Link>
        </div>
      </div>
    </div>
  );
}
