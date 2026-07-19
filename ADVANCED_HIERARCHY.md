# Advanced Hierarchy — Menu Tree, Config & Data Capture

This branch (`advanced_hierarchy`) upgrades the bot from a flat menu to a
**configurable multi-level menu tree** with **user profile capture** and
**zero-cost local data storage**.

## What changed

| Area | Before | Now |
|------|--------|-----|
| Menu | Flat: language → 9 options | Tree: Language → Profile → 3 categories → deep sub-menus (up to 4 levels) |
| Content | Hard-coded in `bot.js` | Externalised in **`config/menu.json`** (edit without touching code) |
| Navigation | "Reply 0 to go back" (one level) | `back` (previous menu) + `menu` (main), at any depth |
| Input | Numbers + keywords | Numbers **and** free-text keywords (both still work) |
| Profile | none | Asks **Name** + **City** (optional) |
| Data | in-memory only (lost on restart) | Metadata persisted to disk + optional **live Google Sheet** |

## Files

```
config/menu.json      ← ALL text, questions, answers, menu structure (edit this)
lib/engine.js         ← pure conversation logic (state machine) — unit-tested
lib/store.js          ← zero-cost local persistence + CSV export
bot.js                ← WhatsApp I/O only (thin wrapper around the engine)
test/engine.test.js   ← headless test of the whole flow (npm test)
```

## Editing content (no code needed)

Open `config/menu.json`. Structure:

- A node with **`children`** is a **menu**.
- A node with **`answer`** is a **final reply**.
- A node with **`ref`** reuses another node's children (e.g. `2.3.9` reuses `2.1`).
- Every `label`/`answer`/prompt supports `en`, `hi`, `hinglish`. If a language
  is missing, the bot falls back to `settings.fallbackLanguage` (English). So you
  can add Hindi/Hinglish translations later, one at a time.
- Placeholders like `{contactEmail}`, `{website}`, `{youtubeHindi}`, `{name}`
  are filled in automatically from `settings` (or the user's name).

Add a question by dropping a new node into the relevant `children` array — the
numbering updates itself. **`menu.json` hot-reloads** while the bot is running,
so edits take effect within ~2 seconds (no restart).

> **Non-technical editing:** the business team can edit all questions/answers in
> a Word document instead of JSON — see **[CONTENT_EDITING.md](./CONTENT_EDITING.md)**
> (`npm run content:export` / `content:import`).

Toggle behaviour in `settings`:
- `collectProfile` — ask for name/city (true/false)
- `cityOptional` — allow skipping city
- `allowFreeText` — accept keywords as well as numbers
- `contactEmail`, `website`, `youtube*`, `instagram` — the links used everywhere

## Data capture (metadata only, zero cost)

Only lightweight **metadata** is captured — no message transcripts:
`name, city, language, interests (L2 categories explored), lastTopic,
messageCount, firstSeen, lastSeen`.

It goes to two places:

- **Local file** `data/leads.json` (always on; git-ignored so PII never reaches GitHub).
- **Live Google Sheet** (optional, recommended for non-technical users) — set
  `settings.googleSheetWebhookUrl` in `menu.json`. Rows appear/update in real
  time. **Full setup: see [DATA_CAPTURE.md](./DATA_CAPTURE.md).**

### Export the local file

```bash
npm run export-leads          # writes data/leads.csv on the VM
scp -i /path/to/key ubuntu@<vm-ip>:~/maasterg-bot/data/leads.csv ./
```

## Test

```bash
npm test     # runs test/engine.test.js — drives a full conversation headlessly
```
