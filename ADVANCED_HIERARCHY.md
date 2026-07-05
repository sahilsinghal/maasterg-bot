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
| Data | in-memory only (lost on restart) | Persisted to disk: `data/leads.json` + `data/interactions.jsonl` |

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

Toggle behaviour in `settings`:
- `collectProfile` — ask for name/city (true/false)
- `cityOptional` — allow skipping city
- `allowFreeText` — accept keywords as well as numbers
- `contactEmail`, `website`, `youtube*`, `instagram` — the links used everywhere

## Data capture (zero cost)

Everyone who chats is recorded to disk on the VM — no database, no cost:

- **`data/leads.json`** — one record per person: `name, city, language,
  firstSeen, lastSeen, messageCount`.
- **`data/interactions.jsonl`** — append-only log, one line per message.

`data/` is git-ignored so PII never reaches GitHub.

### Export the data

```bash
# On the VM: produce a spreadsheet-friendly CSV
npm run export-leads          # writes data/leads.csv

# Or copy the raw files to your machine
scp -i /path/to/key ubuntu@<vm-ip>:~/maasterg-bot/data/leads.json ./
```

Open `data/leads.csv` in Excel / Google Sheets.

> Want it in Google Sheets automatically instead of a file? That's a future
> upgrade (Google Sheets API is free) — the current file-based approach is the
> simplest truly zero-cost option and works offline on the VM.

## Test

```bash
npm test     # runs test/engine.test.js — drives a full conversation headlessly
```
