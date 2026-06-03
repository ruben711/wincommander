# WinCommander — Computer Management oefenplatform

Interactief oefenplatform voor Windows-administratie (**PowerShell, CMD, services, processen,
registry, netwerk, scripts**). Studenten typen commando's in een gesimuleerde Windows-terminal;
een pattern-matching grader beoordeelt ze en toont vooraf-geschreven mock-uitvoer.
Zustermap-kloon van de SQL/Java/WebDev-oefenplatformen, met **dezelfde architectuur**.

UI-taal: **Nederlands (Vlaams, "je")**. Code/cmdlets uiteraard origineel (Get-Service, niet "Krijg-Dienst").

## Kernbeslissingen (vastgelegd met de gebruiker)
- **Geen code-executie.** PowerShell/CMD draaien niet in de browser of server — te onveilig/duur.
  Alles is **client-side pattern-matching** + gesimuleerde output. Veilig, gratis, werkt overal.
- **Thema:** Windows 11 Fluent (light + dark). De ingebedde terminal is een themaonafhankelijk
  donker PowerShell-venster.
- **Scope:** PowerShell-focus, CMD als lichter hoofdstuk (H2). De grader is shell-bewust.
- **Terminal-invoer:** onzichtbare `<textarea>` bovenop een gekleurde `<pre>` (overlay-techniek) →
  échte live syntax-highlighting met rotsvaste textarea-betrouwbaarheid.

## Tech stack
Next.js 14 (App Router) · TypeScript · Tailwind (CSS-var tokens als RGB-triples) ·
Zustand + persist (localStorage) · Upstash Redis (leaderboard/admin/notificaties — optioneel) ·
Vercel. **Geen** sql.js / Monaco / executie-backend.

## Architectuur
```
app/                pages (dashboard, oefeningen, oefeningen/[id], cmdlets, theorie, examen,
                    leaderboard, cheatsheet) + api/ (later: log, leaderboard, notifications, admin)
components/         MockTerminal · TerminalPrompt · OutputFormatter · Highlight · ExerciseRunner ·
                    NavTabs · ThemeToggle · ModeProvider · Footer · XpToast · ComingSoon
                    (later: NotificationBell · StyledName · CustomTag)
lib/                store (XP/streak/badges/favorites/notes, single-track) · theme · identity ·
                    useMounted · exercises (model + helpers) ·
                    winAliases · winCmdlets · winHighlight (display) ·
                    winTokenizer (normalize) · winGrader (match)
data/               exercises.json (+ later cmdlets.json, theorie/h*.json)
styles/globals.css  Fluent theme + terminal + alle component-classes
```

### De grader (`lib/winGrader.ts` + `lib/winTokenizer.ts`)
`normalize(cmd, shell)` brengt een commando naar een **canonieke vorm**, daarna exact vergelijken
met de acceptors van de oefening. Normalisatie is bewust ongevoelig voor:
hoofdletters · quotes (`'x'`=`"x"`=`x`) · spaties · aliassen (`gsv`→Get-Service, `?`→Where-Object) ·
parameter-volgorde (args worden gesorteerd) · en (PowerShell) **scriptblock ≡ shorthand**
(`{ $_.Status -eq 'Running' }` ≡ `Status -eq Running`). Voor `shell:"cmd"` worden PS-aliassen NIET
geëxpandeerd.

**Twee beoordelingsmodi:**
- `type:"command"` → exacte match tegen `acceptors` (canonieke vorm). Voor unieke antwoorden.
- `type:"script"` → meerregelige scripts hebben oneindig veel geldige vormen, dus geen acceptors;
  in plaats daarvan checkt `mustInclude` of de essentiële tokens (cmdlets/keywords/operatoren)
  aanwezig zijn. Dit gebruikt `normalizeLoose()` (lowercase + unquote + alias-expand per token,
  GEEN pipeline-sortering) zodat het ook op meerregelige scripts klopt. Het volledige modelscript
  staat in `solution`.
- Optioneel: `forbid` (hard falen — voor "gebruik geen X"), `acceptRegex` (vrije-vorm regex).

Een oefening hoeft dus **niet elke variant** in `acceptors` te zetten: de canonicalisatie vangt
alias/quote/volgorde/scriptblock al af. Zet wél structureel verschillende geldige vormen erin
(bv. positioneel `Get-Service Win*` vs `Get-Service -Name Win*`, of `-desc` vs `-Descending`).

### Oefening-model (`data/exercises.json`)
Zie `lib/exercises.ts` voor het volledige `Exercise`-type. Types: `command` (standaard),
`multi-step` (`steps[]`), `fill-blank`/`debug` (via `starter`), `predict` (MC — nog te bouwen).
XP: 25 per eerste correcte oplossing; **insane = 0 XP**.

## Curriculum (uit de cursus-PDF's afgeleid — PowerShell scripting + ITIL)
H1 PowerShell-basis · H2 Variabelen & operatoren · H3 Loops & condities ·
H4 Functies & scripting · H5 WMI & CIM · H6 Credentials & rechten ·
H7 Bestanden & data-opslag · H8 Systeem & netwerk · H9 GUI & message boxes.
Theorie: **PowerShell concepten** + **ITIL 4 Foundation** (study-mode quiz).

## Status — alle hoofdtabs werken met echte cursusinhoud
- ✅ Fase 1: layout, Fluent-theming, nav, dashboard, oefeningenlijst.
- ✅ Fase 2: mock-terminal (overlay-highlight, history, tab-completion, Ctrl+C/L).
- ✅ Fase 3: grader (winTokenizer/winGrader/winAliases) — command (acceptor) én script (mustInclude) modus.
- ✅ Fase 4: **124 oefeningen** (H1–H9), **41 cmdlets**, **79 theorievragen** — geëxtraheerd uit de
  cursus via 7 parallelle agents. Cmdlet-bibliotheek, theorie-quiz, examensimulatie en cheat-sheet werken.
- ✅ Data-kwaliteit: `scripts/grader_selftest.ts` beoordeelt elke oefening's eigen modeloplossing →
  **124/124 groen** (elke oefening is oplosbaar).
- ⏳ Nog te doen (server-features, optioneel): leaderboard, verborgen /admin (HMAC), notificaties,
  Discord-logging. Werkt nu 100% client-side zonder env vars.
- `data/` is nu de bron van waarheid (handmatig bewerkbaar). De `.source/`-extracten en
  `scripts/{extract_sources,merge_content}.py` zijn de eenmalige pijplijn die de data genereerde.

## Dev-tips
- `npm run dev` voor ontwikkeling. **Draai NOOIT `next build` terwijl `next dev` loopt** — ze delen
  `.next` en de dev-server serveert dan 404 chunks. Voor een snelle typecheck tijdens dev:
  `npx tsc --noEmit`. Stop dev vóór een productie-build.
- Nieuwe oefening toevoegen = enkel een object in `data/exercises.json`. Nieuwe alias = `lib/winAliases.ts`.
