// ============================================================================
// Business-team content round-trip:  config/menu.json  <->  Excel (.xlsx)
//
//   export : build a shareable .xlsx (one row per question/answer) that the
//            business team edits in Excel or Google Sheets.
//   import : read their edited .xlsx (or .csv) back and update menu.json BY ID.
//
// Only text cells (question label + answers per language) are read and written
// onto the existing menu tree matched by ID — so the team can reword answers
// and add Hindi/Hinglish, but can NEVER break the menu structure.
//
// CLI:
//   node lib/menu-sheet.js export [outfile.xlsx]
//   node lib/menu-sheet.js import <edited.xlsx|.csv> [outConfig.json]
// ============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { loadConfig } = require('./engine');

const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'menu.json');
const DEFAULT_XLSX = path.join(ROOT, 'content', 'MAAsterG_Bot_Content.xlsx');

const HEADERS = ['ID', 'Type', 'Menu Location', 'Question (English)', 'Answer (English)', 'Answer (Hindi)', 'Answer (Hinglish)'];
const COL_W = [12, 10, 26, 30, 60, 60, 60];

// ---------- shared helpers ----------
function xmlEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function xmlDecode(s) {
  return String(s == null ? '' : s)
    .replace(/&#10;/g, '\n').replace(/&#x0?a;/gi, '\n')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
function labelEn(node) {
  const l = node.label || {};
  return l.en != null ? l.en : (Object.values(l)[0] || node.id);
}
function isCategory(node) { return !!(node.children || node.ref); }

function flatten(config) {
  const rows = [];
  const walk = (nodes, trail) => {
    for (const n of nodes) {
      rows.push({
        id: n.id,
        type: isCategory(n) ? 'Category' : 'Question',
        location: trail.join('  >  '),
        question: labelEn(n),
        answer_en: n.answer && n.answer.en != null ? n.answer.en : '',
        answer_hi: n.answer && n.answer.hi != null ? n.answer.hi : '',
        answer_hinglish: n.answer && n.answer.hinglish != null ? n.answer.hinglish : ''
      });
      if (n.children) walk(n.children, trail.concat(labelEn(n)));
    }
  };
  walk(config.menu, []);
  return rows;
}

function colLetter(i) { let s = '', n = i + 1; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function letterToCol(L) { let n = 0; for (let i = 0; i < L.length; i++) n = n * 26 + (L.charCodeAt(i) - 64); return n - 1; }

// ---------- EXPORT (.xlsx, using shared strings — matches Excel's own format) ----------
function exportXlsx(outPath) {
  const config = loadConfig(CONFIG_PATH);
  const S = config.settings || {};
  const out = path.resolve(outPath || DEFAULT_XLSX);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const rows = flatten(config);

  // Intro/instruction rows on top, then a header row, then data.
  const intro = [
    ['MAAsterG Bot — Questions & Answers', '', '', '', '', '', ''],
    ['Edit the Answer columns (English/Hindi/Hinglish). You may reword Question (English). Blank cells fall back to English.', '', '', '', '', '', ''],
    ['Do NOT change the ID column. Keep {curly placeholders} as-is — the bot fills them in automatically.', '', '', '', '', '', ''],
    [`Placeholders:  {contactEmail}=${S.contactEmail || ''}   {website}=${S.website || ''}   {youtubeHindi}=${S.youtubeHindi || ''}   {youtubeEnglish}=${S.youtubeEnglish || ''}   {youtubePlaylists}=${S.youtubePlaylists || ''}   {instagram}=${S.instagram || ''}   {name}=person's name`, '', '', '', '', '', ''],
    ['', '', '', '', '', '', '']
  ];
  const headerRowIndex = intro.length; // 0-based index of the header row
  const matrix = intro.concat([HEADERS]).concat(rows.map(r => [r.id, r.type, r.location, r.question, r.answer_en, r.answer_hi, r.answer_hinglish]));

  // Shared strings table
  const sst = [];
  const sstMap = new Map();
  const sidx = (v) => { const s = String(v == null ? '' : v); if (sstMap.has(s)) return sstMap.get(s); const i = sst.length; sst.push(s); sstMap.set(s, i); return i; };

  let sheetRows = '';
  matrix.forEach((cells, ri) => {
    const rnum = ri + 1;
    const isHeader = ri === headerRowIndex;
    const style = isHeader ? 2 : (ri < headerRowIndex ? 3 : 1); // 3=intro, 2=header, 1=data(wrap)
    let cxml = '';
    cells.forEach((val, ci) => {
      if (val === '' && ci > 0) return; // skip empty (keep col A anchor for row height)
      cxml += `<c r="${colLetter(ci)}${rnum}" t="s" s="${style}"><v>${sidx(val)}</v></c>`;
    });
    sheetRows += `<row r="${rnum}">${cxml}</row>`;
  });

  const cols = COL_W.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const freeze = `<sheetView workbookViewId="0"><pane ySplit="${headerRowIndex + 1}" topLeftCell="A${headerRowIndex + 2}" activePane="bottomLeft" state="frozen"/></sheetView>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews>${freeze}</sheetViews><cols>${cols}</cols><sheetData>${sheetRows}</sheetData></worksheet>`;

  const sstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sst.length}" uniqueCount="${sst.length}">${sst.map(s => `<si><t xml:space="preserve">${xmlEsc(s)}</t></si>`).join('')}</sst>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
</cellXfs></styleSheet>`;

  // Assemble the package
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgxlsx-'));
  fs.mkdirSync(path.join(tmp, '_rels'));
  fs.mkdirSync(path.join(tmp, 'xl'));
  fs.mkdirSync(path.join(tmp, 'xl', '_rels'));
  fs.mkdirSync(path.join(tmp, 'xl', 'worksheets'));

  fs.writeFileSync(path.join(tmp, '[Content_Types].xml'),
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`);

  fs.writeFileSync(path.join(tmp, '_rels', '.rels'),
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  fs.writeFileSync(path.join(tmp, 'xl', 'workbook.xml'),
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Content" sheetId="1" r:id="rId1"/></sheets></workbook>`);

  fs.writeFileSync(path.join(tmp, 'xl', '_rels', 'workbook.xml.rels'),
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`);

  fs.writeFileSync(path.join(tmp, 'xl', 'worksheets', 'sheet1.xml'), sheetXml);
  fs.writeFileSync(path.join(tmp, 'xl', 'styles.xml'), stylesXml);
  fs.writeFileSync(path.join(tmp, 'xl', 'sharedStrings.xml'), sstXml);

  try { fs.unlinkSync(out); } catch (e) { /* ignore */ }
  execSync(`zip -q -X -r "${out}" "[Content_Types].xml" "_rels" "xl"`, { cwd: tmp });
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(`✅ Exported ${rows.length} rows to ${out}`);
  return out;
}

// ---------- IMPORT ----------
function parseSharedStrings(xml) {
  if (!xml) return [];
  return (xml.match(/<si>[\s\S]*?<\/si>/g) || []).map(si => {
    const ts = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
    return ts.map(t => xmlDecode(t.replace(/<t[^>]*>/, '').replace(/<\/t>/, ''))).join('');
  });
}

function parseXlsx(xlsxPath) {
  const list = execSync(`unzip -Z1 "${xlsxPath}"`, { maxBuffer: 1e8 }).toString().split('\n');
  const wsName = list.find(f => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)) || 'xl/worksheets/sheet1.xml';
  const get = (name) => { try { return execSync(`unzip -p "${xlsxPath}" "${name}"`, { maxBuffer: 1e8 }).toString('utf8'); } catch (e) { return ''; } };

  const shared = parseSharedStrings(get('xl/sharedStrings.xml'));
  const ws = get(wsName);

  const rows = [];
  (ws.match(/<row[ >][\s\S]*?<\/row>/g) || []).forEach(rowXml => {
    const cells = rowXml.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || [];
    const arr = [];
    cells.forEach(c => {
      const ref = (c.match(/\br="([A-Z]+)\d+"/) || [])[1];
      const ci = ref ? letterToCol(ref) : arr.length;
      const t = (c.match(/\bt="([^"]+)"/) || [])[1];
      let val = '';
      if (t === 's') { const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1]; val = shared[parseInt(v, 10)] || ''; }
      else if (t === 'inlineStr') { const ts = c.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []; val = ts.map(x => xmlDecode(x.replace(/<t[^>]*>/, '').replace(/<\/t>/, ''))).join(''); }
      else { const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1]; val = v != null ? xmlDecode(v) : ''; }
      arr[ci] = val;
    });
    for (let i = 0; i < arr.length; i++) if (arr[i] == null) arr[i] = '';
    rows.push(arr);
  });
  return rows;
}

// Minimal RFC-4180 CSV parser (handles quotes, embedded newlines, delimiter sniff, BOM)
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const delim = (first.split(';').length > first.split(',').length) ? ';' : (first.split('\t').length > first.split(',').length ? '\t' : ',');
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === delim) { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function importSheet(sheetPath, outConfigPath) {
  const ext = path.extname(sheetPath).toLowerCase();
  const rows = ext === '.csv' ? parseCsv(fs.readFileSync(sheetPath, 'utf8')) : parseXlsx(sheetPath);

  // Find the header row (the one that contains an "ID" cell)
  const norm = (v) => String(v == null ? '' : v).trim().toLowerCase();
  const hIdx = rows.findIndex(r => r.some(c => norm(c) === 'id'));
  if (hIdx === -1) throw new Error('Could not find a header row with an "ID" column.');
  const header = rows[hIdx].map(norm);
  const find = (pred) => header.findIndex(pred);
  const col = {
    id: find(h => h === 'id'),
    question: find(h => h.includes('question') || h.includes('label')),
    answer_en: find(h => h.includes('answer') && h.includes('english')),
    answer_hi: find(h => h.includes('answer') && h.includes('hindi')),
    answer_hinglish: find(h => h.includes('answer') && h.includes('hinglish'))
  };

  const config = loadConfig(CONFIG_PATH);
  const index = {};
  (function bi(ns) { ns.forEach(n => { index[n.id] = n; if (n.children) bi(n.children); }); })(config.menu);

  let updated = 0, questions = 0, answers = 0, unknown = 0;
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const id = (r[col.id] || '').trim();
    if (!id) continue;
    const node = index[id];
    if (!node) { unknown++; continue; }
    let touched = false;

    if (col.question > -1) {
      const q = (r[col.question] || '').trim();
      if (q && q !== labelEn(node)) { node.label = node.label || {}; node.label.en = q; questions++; touched = true; }
    }
    if (!isCategory(node)) {
      const set = (lang, ci) => {
        if (ci < 0) return;
        const val = r[ci];
        if (val == null || val === '') return;
        const cur = node.answer && node.answer[lang] != null ? node.answer[lang] : '';
        if (val !== cur) { node.answer = node.answer || {}; node.answer[lang] = val; answers++; touched = true; }
      };
      set('en', col.answer_en);
      set('hi', col.answer_hi);
      set('hinglish', col.answer_hinglish);
    }
    if (touched) updated++;
  }

  const out = path.resolve(outConfigPath || CONFIG_PATH);
  if (fs.existsSync(out)) {
    const bak = out + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.bak';
    fs.copyFileSync(out, bak);
    console.log(`🗂  Backed up existing config to ${path.basename(bak)}`);
  }
  fs.writeFileSync(out, JSON.stringify(config, null, 2) + '\n');
  console.log(`✅ Imported: ${updated} nodes updated (${questions} questions, ${answers} answer fields).${unknown ? ' ' + unknown + ' unknown IDs skipped.' : ''}`);
  console.log(`   Wrote ${out}`);
  return config;
}

module.exports = { exportXlsx, importSheet, parseXlsx, parseCsv, flatten };

// ---------- CLI ----------
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'export') exportXlsx(process.argv[3]);
  else if (cmd === 'import') {
    if (!process.argv[3]) { console.error('Usage: node lib/menu-sheet.js import <edited.xlsx|.csv> [outConfig.json]'); process.exit(1); }
    importSheet(process.argv[3], process.argv[4]);
  } else {
    console.log('Usage:\n  node lib/menu-sheet.js export [outfile.xlsx]\n  node lib/menu-sheet.js import <edited.xlsx|.csv> [outConfig.json]');
  }
}
