// ============================================================================
// Metadata store for the MAAsterG bot.
//
// Captures ONLY lightweight metadata per person (no message transcripts):
//   name, city, language, first/last seen, message count,
//   interests (which L2 categories they explored), last topic viewed.
//
// Two sinks, both zero-cost:
//   1. Local file  data/leads.json   (always on; survives restarts on the VM)
//   2. Google Sheet (optional)        via a Google Apps Script Web App URL,
//      so a non-technical person sees a live spreadsheet. See DATA_CAPTURE.md.
//
// Export the local file to CSV:  npm run export-leads
// ============================================================================

const fs = require('fs');
const path = require('path');

class Store {
  constructor(settings = {}) {
    this.dataDir = settings.dataDir || 'data';
    this.webhookUrl = settings.googleSheetWebhookUrl || '';
    this.leadsFile = path.join(this.dataDir, 'leads.json');
    this.leads = {};

    try { fs.mkdirSync(this.dataDir, { recursive: true }); } catch (e) { /* ignore */ }

    try {
      if (fs.existsSync(this.leadsFile)) {
        this.leads = JSON.parse(fs.readFileSync(this.leadsFile, 'utf-8')) || {};
      }
    } catch (e) {
      console.error('⚠️  Could not read leads file, starting fresh:', e.message);
      this.leads = {};
    }
  }

  // Atomic-ish write: temp file + rename, so a crash never corrupts leads.json.
  _flush() {
    try {
      const tmp = this.leadsFile + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.leads, null, 2));
      fs.renameSync(tmp, this.leadsFile);
    } catch (e) {
      console.error('⚠️  Failed to save leads:', e.message);
    }
  }

  // Push one person's metadata to the Google Sheet (fire-and-forget, non-blocking).
  _sync(lead) {
    if (!this.webhookUrl) return;
    try {
      const payload = {
        jid: lead.jid, name: lead.name, city: lead.city, language: lead.language,
        firstSeen: lead.firstSeen, lastSeen: lead.lastSeen, messageCount: lead.messageCount,
        interests: (lead.interests || []).join(', '), lastTopic: lead.lastTopic || ''
      };
      // Node 20+ has global fetch. Fire-and-forget; log failures only.
      fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.error('⚠️  Google Sheet sync failed:', e.message));
    } catch (e) {
      console.error('⚠️  Google Sheet sync error:', e.message);
    }
  }

  getOrCreate(jid) {
    if (!this.leads[jid]) {
      const now = new Date().toISOString();
      this.leads[jid] = {
        jid, name: null, city: null, language: null,
        firstSeen: now, lastSeen: now, messageCount: 0,
        interests: [], lastTopic: null
      };
    }
    return this.leads[jid];
  }

  // One inbound message: bump counters only (no Sheet sync — avoids spamming).
  recordMessage(jid) {
    const lead = this.getOrCreate(jid);
    lead.messageCount += 1;
    lead.lastSeen = new Date().toISOString();
    this._flush();
    return lead;
  }

  // Profile fields changed (name / city / language) — persist + sync to Sheet.
  updateProfile(jid, fields) {
    const lead = this.getOrCreate(jid);
    Object.assign(lead, fields);
    lead.lastSeen = new Date().toISOString();
    this._flush();
    this._sync(lead);
    return lead;
  }

  // Record an L2 interest (only when new) — persist + sync.
  addInterest(jid, label) {
    if (!label) return;
    const lead = this.getOrCreate(jid);
    if (!lead.interests.includes(label)) {
      lead.interests.push(label);
      lead.lastSeen = new Date().toISOString();
      this._flush();
      this._sync(lead);
    }
  }

  // Record the last specific topic viewed — persist + sync.
  setLastTopic(jid, label) {
    if (!label) return;
    const lead = this.getOrCreate(jid);
    lead.lastTopic = label;
    lead.lastSeen = new Date().toISOString();
    this._flush();
    this._sync(lead);
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
// CLI:  node lib/store.js export-csv [dataDir]  → writes data/leads.csv
// ---------------------------------------------------------------------------
if (require.main === module) {
  const cmd = process.argv[2];
  const dir = process.argv[3] || 'data';
  if (cmd === 'export-csv') {
    const store = new Store({ dataDir: dir });
    const rows = Object.values(store.leads);
    const cols = ['name', 'city', 'language', 'interests', 'lastTopic', 'messageCount', 'firstSeen', 'lastSeen', 'jid'];
    const esc = (v) => `"${String(v == null ? '' : Array.isArray(v) ? v.join(', ') : v).replace(/"/g, '""')}"`;
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
