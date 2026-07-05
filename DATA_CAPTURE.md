# Data Capture — Live Google Sheet (for non-technical users)

The bot captures **only lightweight metadata** about each person who chats — no
message transcripts:

| Field | Meaning |
|-------|---------|
| name | Name they gave |
| city | City (optional) |
| language | English / Hindi / Hinglish |
| interests | Which L2 categories they explored (e.g. "Clarity & Guidance", "Vaanis") |
| lastTopic | The last specific question they opened |
| messageCount | How many messages they sent |
| firstSeen / lastSeen | Timestamps |

This data goes to **two places**:

1. **Always:** a local file on the VM — `data/leads.json` (export to CSV with
   `npm run export-leads`).
2. **Optional (recommended):** a **live Google Sheet** so anyone non-technical
   can just open a spreadsheet and see everyone — updating in real time.

## Set up the live Google Sheet (one-time, ~5 minutes, FREE)

No coding, no API keys, no Google Cloud project needed. We use a small
**Google Apps Script** attached to a normal Google Sheet.

### 1. Create the Sheet
- Go to [sheets.new](https://sheets.new) and name it e.g. **MAAsterG Leads**.

### 2. Add the script
- In the Sheet: **Extensions → Apps Script**.
- Delete whatever code is there and paste this:

```javascript
// Receives lead metadata from the MAAsterG bot and MERGES it into one row per
// person (matched by jid). It never clears the sheet — it only appends a new
// row or updates an existing one. The merge makes the sheet the durable source
// of truth: a bot restart, redeploy, or even a lost data/leads.json can NEVER
// blank or reset a person's row (existing values are kept when the incoming
// value is empty; firstSeen keeps the earliest; messageCount keeps the highest;
// interests are unioned).
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    var headers = ['name','city','language','interests','lastTopic','messageCount','firstSeen','lastSeen','jid'];
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);

    // Find existing row for this jid (if any)
    var jidCol = headers.indexOf('jid');
    var last = sheet.getLastRow();
    var foundRow = 0, existing = {};
    if (last > 1) {
      var rng = sheet.getRange(2, 1, last - 1, headers.length).getValues();
      for (var i = 0; i < rng.length; i++) {
        if (rng[i][jidCol] === data.jid) {
          foundRow = i + 2;
          for (var c = 0; c < headers.length; c++) existing[headers[c]] = rng[i][c];
          break;
        }
      }
    }

    function has(v){ return v !== null && v !== undefined && v !== ''; }
    var merged = {};
    // Keep existing value whenever the incoming one is empty
    headers.forEach(function(h){ merged[h] = has(data[h]) ? data[h] : (existing[h] || ''); });
    merged.jid = data.jid;

    // firstSeen = earliest, lastSeen = latest, messageCount = highest
    if (existing.firstSeen && data.firstSeen)
      merged.firstSeen = (String(existing.firstSeen) < String(data.firstSeen)) ? existing.firstSeen : data.firstSeen;
    if (existing.lastSeen && data.lastSeen)
      merged.lastSeen = (String(existing.lastSeen) > String(data.lastSeen)) ? existing.lastSeen : data.lastSeen;
    merged.messageCount = Math.max(parseInt(existing.messageCount, 10) || 0, parseInt(data.messageCount, 10) || 0);

    // interests = union of existing + incoming (comma-separated, de-duplicated)
    function toList(s){ return String(s||'').split(',').map(function(x){return x.trim();}).filter(String); }
    var seen = {}, union = [];
    toList(existing.interests).concat(toList(data.interests)).forEach(function(x){ if(!seen[x]){seen[x]=1;union.push(x);} });
    merged.interests = union.join(', ');

    var row = headers.map(function(h){ return merged[h]; });
    if (foundRow) sheet.getRange(foundRow, 1, 1, headers.length).setValues([row]);
    else sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

### 3. Deploy it as a Web App
- Click **Deploy → New deployment**.
- Gear icon → **Web app**.
- **Execute as:** *Me*.
- **Who has access:** *Anyone*.
- Click **Deploy**, authorise when prompted, and **copy the Web app URL**
  (looks like `https://script.google.com/macros/s/AKfy.../exec`).

### 4. Give the URL to the bot

**Recommended — via `.env` (keeps the URL out of git):**

```bash
# in the project root, in .env  (copy from .env.example)
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/AKfy.../exec
```

Then restart: `pm2 restart maasterg-bot`.

Alternatively (less secure, ends up in git) you can set it in
`config/menu.json` → `settings.googleSheetWebhookUrl`. The `.env` value always
wins if both are set.

That's it — as people chat, rows appear/update in your Google Sheet
automatically. Share the Sheet (View access) with anyone who needs to see it.

## Restart / redeploy safety

- **A bot restart never clears the Google Sheet.** The Sheet lives in Google,
  independent of the bot; the script only appends or merge-updates rows.
- On a normal restart the bot reloads `data/leads.json` from the VM's persistent
  disk, so nothing is lost.
- Even in the worst case (the VM is rebuilt and `data/leads.json` is gone), the
  **merge** logic above protects every Sheet row: empty incoming fields keep the
  existing value, `firstSeen` keeps the earliest date, `messageCount` keeps the
  highest, and `interests` are unioned. So a person's accumulated data survives.

## Notes
- If `googleSheetWebhookUrl` is left empty, the bot simply skips the Sheet and
  keeps the local `data/leads.json` file only.
- Sync is **fire-and-forget**: if Google is briefly unreachable, the bot logs a
  warning and keeps working; the local file always has the full picture.
- To keep the Web App URL private, you can add a shared secret token — ask and
  we can wire that in.

## Local export (no Google needed)

```bash
npm run export-leads                 # writes data/leads.csv on the VM
scp -i key ubuntu@<ip>:~/maasterg-bot/data/leads.csv ./   # copy to your machine
```
