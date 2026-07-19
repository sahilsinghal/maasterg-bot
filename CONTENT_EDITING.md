# Editing Bot Content with the Business Team

The business team never touches code. They edit a **Word document** of all
questions and answers, and it plugs straight back into the bot.

```
config/menu.json  ──export──►  content/MAAsterG_Bot_Content.docx  ──(business edits)──►  send back  ──import──►  config/menu.json
```

## 1. Generate the document to share

```bash
npm run content:export
```

This creates **`content/MAAsterG_Bot_Content.docx`** — a table with one row per
menu item:

| ID | Type | Menu Location | Question (English) | Answer (English) | Answer (Hindi) | Answer (Hinglish) |
|----|------|---------------|--------------------|------------------|----------------|-------------------|

Send that file to the business team (email / Google Drive / WhatsApp).

## 2. What the business team does

They open it in **Word or Google Docs** and:
- Edit the **Answer** columns (English / Hindi / Hinglish).
- Optionally reword the **Question (English)** column.
- Add Hindi / Hinglish translations (blank cells fall back to English).
- **Leave the ID column unchanged** (that's how text is matched back).
- **Leave `{curly placeholders}` as-is** — the bot fills in links/name/email
  automatically (a legend is printed at the top of the document).
- Save as `.docx` and send it back.

Rows marked **Category** are menu headings (no answer). Rows marked
**Question** are the actual replies people receive.

## 3. Plug their file back in

```bash
npm run content:import -- path/to/their-edited.docx
```

This:
- Reads the doc and updates `config/menu.json` **by ID** (only text — the menu
  structure can't be broken by editing).
- Backs up the previous config to `config/menu.json.<timestamp>.bak` first.
- Prints a summary, e.g. `Imported: 12 nodes updated (3 questions, 15 answer fields)`.

Then verify and deploy:

```bash
npm test                       # confirms the config still drives the bot
pm2 restart maasterg-bot       # on the VM (menu.json also hot-reloads)
```

## Notes
- The import is **safe**: unknown IDs are skipped, categories never get answers,
  and empty cells are left as the existing value (so a half-translated doc won't
  wipe anything).
- You can point import at any output path for review first:
  `node lib/menu-doc.js import their.docx /tmp/review.json`
- Import re-writes `menu.json` in standard JSON formatting (functionally
  identical; just not the hand-compacted layout).
