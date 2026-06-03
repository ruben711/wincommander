import ComingSoon from "@/components/ComingSoon";

export default function LeaderboardPage() {
  return (
    <ComingSoon
      title="Leaderboard"
      emoji="🏆"
      lead="Een online ranglijst op XP — optioneel, en pas actief wanneer de server-features ingesteld zijn."
      bullets={[
        "Auto-sync van je XP na elke opgeloste oefening",
        "Custom tags & naam-styling (kleuren, gradient, glow, particles)",
        "Live-update elke 20 seconden",
      ]}
    />
  );
}
