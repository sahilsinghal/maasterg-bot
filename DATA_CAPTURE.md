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
// Receives lead metadata from the MAAsterG bot and upserts one row per person.
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = JSON.parse(e.postData.contents);

    var headers = ['name','city','language','interests','lastTopic','messageCount','firstSeen','lastSeen','jid'];
    // Write header row once
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);

    var row = headers.map(function(h){ return data[h] != null ? data[h] : ''; });

    // Upsert by jid (last column): update existing row or append a new one
    var jidCol = headers.indexOf('jid') + 1;
    var last = sheet.getLastRow();
    var found = 0;
    if (last > 1) {
      var jids = sheet.getRange(2, jidCol, last - 1, 1).getValues();
      for (var i = 0; i < jids.length; i++) {
        if (jids[i][0] === data.jid) { found = i + 2; break; }
      }
    }
    if (found) sheet.getRange(found, 1, 1, headers.length).setValues([row]);
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
Open `config/menu.json` and paste the URL:

```json
"settings": {
  ...
  "googleSheetWebhookUrl": "https://script.google.com/macros/s/AKfy.../exec"
}
```

Save. The bot hot-reloads config, so it takes effect within a couple of
seconds (or restart with `pm2 restart maasterg-bot`).

That's it — as people chat, rows appear/update in your Google Sheet
automatically. Share the Sheet (View access) with anyone who needs to see it.

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
