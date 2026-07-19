# Editing Bot Content with the Business Team

The business team never touches code. They edit an **Excel spreadsheet** of all
questions and answers, and it plugs straight back into the bot.

```
config/menu.json ──export──► content/MAAsterG_Bot_Content.xlsx ──(team edits in Excel / Google Sheets)──► send back ──import──► config/menu.json
```

## 1. Generate the spreadsheet to share

```bash
npm run content:export
```

Creates **`content/MAAsterG_Bot_Content.xlsx`** — one row per menu item, with a
frozen header and wrapped cells:

| ID | Type | Menu Location | Question (English) | Answer (English) | Answer (Hindi) | Answer (Hinglish) |
|----|------|---------------|--------------------|------------------|----------------|-------------------|

The top rows are instructions + a placeholder legend. Send the file to the team
(email / Google Drive / WhatsApp). It opens in **Excel or Google Sheets**.

## 2. What the business team does

- Edit the **Answer** columns (English / Hindi / Hinglish).
- Optionally reword **Question (English)**.
- Add Hindi / Hinglish translations (blank cells fall back to English) — tip:
  filter the Hindi column by "blanks" to see what still needs translating.
- **Leave the ID column unchanged** (that's how text is matched back).
- **Leave `{curly placeholders}` as-is** — the bot fills in links/name/email.
- Save as `.xlsx` (or export CSV from Google Sheets) and send it back.

Rows marked **Category** are menu headings (no answer). Rows marked **Question**
are the actual replies people receive.

## 3. Plug their file back in

```bash
npm run content:import -- path/to/their-edited.xlsx     # .xlsx or .csv both work
```

This:
- Reads the sheet and updates `config/menu.json` **by ID** (only text — the menu
  structure can't be broken by editing).
- Backs up the previous config to `config/menu.json.<timestamp>.bak` first.
- Prints a summary, e.g. `Imported: 12 nodes updated (3 questions, 15 answer fields)`.

Then verify and deploy:

```bash
npm test                       # confirms the config still drives the bot
pm2 restart maasterg-bot       # on the VM (menu.json also hot-reloads)
```

## Notes
- Accepts **`.xlsx`** (Excel/Google Sheets) and **`.csv`** on import.
- The import is **safe**: unknown IDs are skipped, categories never get answers,
  and empty cells keep the existing value (so a half-translated sheet won't wipe
  anything).
- Review before applying by writing to a temp file:
  `node lib/menu-sheet.js import their.xlsx /tmp/review.json`
- Import re-writes `menu.json` in standard JSON formatting (functionally
  identical; just not the hand-compacted layout).
