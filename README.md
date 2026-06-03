# WinCommander

Interactief oefenplatform voor **Computer Management** — PowerShell, CMD & ITIL 4.
Schrijf commando's in een realistische Windows-terminal, krijg directe feedback en
gesimuleerde uitvoer. Veilig in de browser, **geen code-uitvoering**, **€ 0 hosting**.

## Features
- 🖥️ **Mock-terminal** (Windows-Terminal look): live syntax-highlighting, tab-completion,
  command-history, Ctrl+C/L, PowerShell Format-Table output.
- 🧠 **Alias-tolerante grader** — hoofdletter-, quote-, spatie-, alias- en parameter-volgorde-
  ongevoelig; scriptblock ≡ shorthand. Twee modi: *command* (exacte match) en *script*
  (token-controle voor meerregelige scripts).
- 📚 **124 oefeningen** (H1–H9), **41 cmdlets**, **79 theorievragen** (PowerShell + ITIL 4).
- 🎮 XP, levels, streaks, badges, favorieten, notities — alles lokaal (Zustand + localStorage).
- 🎓 Theorie-quiz, ⏱️ examensimulatie, 📋 printbare cheat-sheet, 📖 cmdlet-bibliotheek.
- 🎨 Windows 11 Fluent thema (light + dark).

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand. Geen backend nodig.

## Lokaal draaien
```bash
npm install
npm run dev      # http://localhost:3000
```

## Deployen op Vercel
1. Push deze repo naar GitHub (zie hieronder).
2. Op [vercel.com](https://vercel.com): **Add New → Project → Import** je GitHub-repo.
3. Framework wordt automatisch herkend als **Next.js**. Klik **Deploy**.
4. Klaar — er zijn **geen environment variables nodig**.

## Environment variables (allemaal optioneel)
De basisapp werkt 100% client-side zonder env vars. Onderstaande variabelen activeren
toekomstige server-features en hoef je pas in te vullen wanneer die gebouwd zijn
(zie `.env.example`):

| Variabele | Nodig voor | Hoe verkrijgen |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` / `..._TOKEN` | Leaderboard, sessies, notificaties | Gratis DB op [console.upstash.com](https://console.upstash.com) |
| `ADMIN_PASSWORD` | Verborgen `/admin` login | Kies zelf een sterk wachtwoord |
| `ADMIN_SECRET` | Cookie-signing voor admin | `openssl rand -hex 32` |
| `DISCORD_WEBHOOK_URL` | Discord event-logging | Discord → kanaal → Integrations → Webhooks |
| `LOG_SECRET` | Beschermt `/api/log` | `openssl rand -hex 16` |

## Inhoud bewerken
Alle content staat in `data/` (de bron van waarheid):
- `data/exercises.json` — oefeningen
- `data/cmdlets.json` — cmdlet-bibliotheek
- `data/theorie.json` — theorievragen

`scripts/extract_sources.py` + `scripts/merge_content.py` waren de eenmalige pijplijn
die deze data uit de cursus-PDF's genereerde. `scripts/grader_selftest.ts` controleert
dat elke oefening's modeloplossing correct beoordeeld wordt.
