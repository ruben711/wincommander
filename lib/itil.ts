import data from "@/data/itil-cards.json";
import { getTheory, type TheoryQ } from "./theorie";

export type ItilCard = { front: string; back: string; example?: string };
export type ItilTopic = { id: string; title: string; icon?: string; intro?: string; cards: ItilCard[] };

const TOPICS = (((data as any)?.topics) ?? []) as ItilTopic[];

export const ITIL_CHAPTER = "ITIL 4 Foundation";

export function itilTopics(): ItilTopic[] {
  return TOPICS.filter((t) => t.cards && t.cards.length);
}
export function itilQuestions(): TheoryQ[] {
  return getTheory().filter((q) => q.chapter === ITIL_CHAPTER);
}
export function itilSubtopics(): string[] {
  const s = new Set<string>();
  for (const q of itilQuestions()) if (q.subtopic) s.add(q.subtopic);
  return [...s];
}
