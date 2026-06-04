"use client";
import { useState } from "react";
import type { ItilCard } from "@/lib/itil";

export default function Flashcard({ card }: { card: ItilCard }) {
  const [showBack, setShowBack] = useState(false);
  return (
    <button
      onClick={() => setShowBack((b) => !b)}
      className="card card-pad text-left w-full min-h-[150px] flex flex-col justify-center relative hover:border-brand hover:shadow-fluent-md transition-all"
      aria-label="Draai de kaart om"
    >
      <span className="absolute top-2 right-3 text-[10px] text-fg-dim select-none">
        {showBack ? "↩ klik om terug te draaien" : "klik om te draaien"}
      </span>
      {!showBack ? (
        <div className="text-center px-2 py-3">
          <div className="text-lg font-semibold">{card.front}</div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="font-semibold text-brand mb-1.5">{card.front}</div>
          <p className="text-[13px] text-fg-muted leading-relaxed">{card.back}</p>
          {card.example && (
            <p className="mt-2 text-2xs text-fg-dim border-l-2 border-line pl-2">
              <span className="font-medium text-fg-muted">Voorbeeld: </span>{card.example}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
