// ============================================================================
// Zero-cost local data store for MAAsterG bot.
//
// Persists to plain files on the server's disk — no database, no external
// service, no cost. On an Oracle Cloud Always Free VM the disk is persistent,
// so this data survives restarts and redeploys.
//
//   data/leads.json         → one record per person (name, city, language,
//                             first/last seen, message count). Human-readable.
//   data/interactions.jsonl → append-only audit log, one JSON line per message.
//
// Export any time by copying the files off the VM, e.g.:
//   scp -i key ubuntu@<ip>:~/maasterg-bot/data/leads.json ./
// A CSV can be produced from leads.json with `node lib/store.js export-csv`.
// ============================================================================

const fs = require('fs');
const path = require('path');

class Store {
  constructor(dataDir) {
    this.dataDir = dataDir || 'data';
    this.leadsFile = path.join(this.dataDir, 'leads.json');
    this.logFile = path.join(this.dataDir, 'interactions.jsonl');
    this.leads = {};

    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
    } catch (e) { /* ignore */ }

    // Load existing leads (if any)
    try {
      if (fs.existsSync(this.leadsFile)) {
        this.leads = JSON.parse(fs.readFileSync(this.leadsFile, 'utf-8')) || {};
      }
    } catch (e) {
      console.error('⚠️  Could not read leads file, starting fresh:', e.message);
      this.leads = {};
    }
  }

  // Atomic-ish write: write to a temp file then rename, so a crash mid-write
  // never corrupts leads.json.
  _flushLeads() {
    try {
      const tmp = this.leadsFile + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.leads, null, 2));
      fs.renameSync(tmp, this.leadsFile);
    } catch (e) {
      console.error('⚠️  Failed to save leads:', e.message);
    }
  }

  // Create/return the lead record for a WhatsApp id.
  getOrCreate(jid) {
    if (!this.leads[jid]) {
      const now = new Date().toISOString();
      this.leads[jid] = {
        jid,
        name: null,
        city: null,
        language: null,
        firstSeen: now,
        lastSeen: now,
        messageCount: 0
      };
    }
    return this.leads[jid];
  }

  // Update profile fields (name / city / language) and persist.
  updateProfile(jid, fields) {
    const lead = this.getOrCreate(jid);
    Object.assign(lead, fields);
    lead.lastSeen = new Date().toISOString();
    this._flushLeads();
    return lead;
  }

  // Record one inbound interaction: bumps counters + appends to the audit log.
  recordInteraction(jid, { text, nodeId, stage } = {}) {
    const lead = this.getOrCreate(jid);
    lead.messageCount += 1;
    lead.lastSeen = new Date().toISOString();
    this._flushLeads();

    try {
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        jid,
        name: lead.name,
        city: lead.city,
        language: lead.language,
        stage: stage || null,
        nodeId: nodeId || null,
        text: text || null
      }) + '\n';
      fs.appendFileSync(this.logFile, line);
    } catch (e) {
      console.error('⚠️  Failed to append interaction log:', e.message);
    }
  }

  stats() {
    const all = Object.values(this.leads);
    return {
      totalPeople: all.length,
      withName: all.filter(l => l.name).length,
      withCity: all.filter(l => l.city).length
    };
  }
}

module.exports = { Store };

// ---------------------------------------------------------------------------
// CLI helper:  node lib/store.js export-csv  [dataDir]
// Produces data/leads.csv from leads.json for easy viewing in Excel/Sheets.
// ---------------------------------------------------------------------------
if (require.main === module) {
  const cmd = process.argv[2];
  const dir = process.argv[3] || 'data';
  if (cmd === 'export-csv') {
    const store = new Store(dir);
    const rows = Object.values(store.leads);
    const cols = ['jid', 'name', 'city', 'language', 'firstSeen', 'lastSeen', 'messageCount'];
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = [cols.join(',')]
      .concat(rows.map(r => cols.map(c => esc(r[c])).join(',')))
      .join('\n');
    const out = path.join(dir, 'leads.csv');
    fs.writeFileSync(out, csv);
    console.log(`✅ Wrote ${rows.length} people to ${out}`);
  } else {
    console.log('Usage: node lib/store.js export-csv [dataDir]');
  }
}
