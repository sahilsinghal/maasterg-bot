// ============================================================================
// Business-team content round-trip: config/menu.json  <->  Word (.docx)
//
//   export : build a shareable Word document (a table of every question/answer)
//            that the business team can edit in Word / Google Docs.
//   import : read their edited .docx back and update config/menu.json BY ID.
//
// The doc is a table keyed by a stable ID column. On import we only read the
// text cells (question label + answers per language) and write them onto the
// existing menu tree matched by ID — so the business team can reword answers
// and add Hindi/Hinglish translations, but can NEVER break the menu structure.
//
// CLI:
//   node lib/menu-doc.js export [outfile.docx]
//   node lib/menu-doc.js import <edited.docx> [outConfig.json]
// ============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { loadConfig } = require('./engine');

const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'menu.json');
const DEFAULT_DOC = path.join(ROOT, 'content', 'MAAsterG_Bot_Content.docx');

const HEADERS = ['ID', 'Type', 'Menu Location', 'Question (English)', 'Answer (English)', 'Answer (Hindi)', 'Answer (Hinglish)'];
const COL_W = [1100, 1100, 2500, 2600, 2600, 2600, 2600]; // twips (landscape ~15100 usable)

// ---------- shared helpers ----------
function xmlEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function xmlDecode(s) {
  return String(s == null ? '' : s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}
function labelEn(node) {
  const l = node.label || {};
  return l.en != null ? l.en : (Object.values(l)[0] || node.id);
}
function isCategory(node) { return !!(node.children || node.ref); }

// Flatten the tree in reading order, carrying a human-readable location path.
function flatten(config) {
  const rows = [];
  const walk = (nodes, trail) => {
    for (const n of nodes) {
      const loc = trail.join('  >  ');
      rows.push({
        id: n.id,
        type: isCategory(n) ? 'Category' : 'Question',
        location: loc,
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

// ---------- EXPORT (build .docx) ----------
function para(text, opts = {}) {
  const rpr = [];
  if (opts.bold) rpr.push('<w:b/>');
  if (opts.size) rpr.push(`<w:sz w:val="${opts.size}"/>`);
  const rPr = rpr.length ? `<w:rPr>${rpr.join('')}</w:rPr>` : '';
  return `<w:p>${opts.pPr || ''}<w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r></w:p>`;
}
function cell(text, w, header) {
  const shd = header ? '<w:shd w:val="clear" w:color="auto" w:fill="D9D9D9"/>' : '';
  const lines = String(text == null ? '' : text).split('\n');
  const bold = header ? { bold: true } : {};
  const body = lines.map(l => para(l, bold)).join('') || '<w:p/>';
  return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${shd}</w:tcPr>${body}</w:tc>`;
}
function row(cells) { return `<w:tr>${cells.join('')}</w:tr>`; }

function buildDocumentXml(config) {
  const rows = flatten(config);
  const S = config.settings || {};

  const borders = `<w:tblBorders>
    <w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/>
    <w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/>
    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/>
    <w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/>
    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/>
    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/>
  </w:tblBorders>`;

  const headerRow = row(HEADERS.map((h, i) => cell(h, COL_W[i], true)));
  const dataRows = rows.map(r => row([
    cell(r.id, COL_W[0]),
    cell(r.type, COL_W[1]),
    cell(r.location, COL_W[2]),
    cell(r.question, COL_W[3]),
    cell(r.answer_en, COL_W[4]),
    cell(r.answer_hi, COL_W[5]),
    cell(r.answer_hinglish, COL_W[6])
  ])).join('');

  const table = `<w:tbl><w:tblPr><w:tblW w:w="15100" w:type="dxa"/>${borders}</w:tblPr>${headerRow}${dataRows}</w:tbl>`;

  const intro = [
    para('MAAsterG Bot — Questions & Answers', { bold: true, size: 36 }),
    para('How to edit this document (please read):', { bold: true, size: 26 }),
    para('•  Edit the Answer columns (English / Hindi / Hinglish). You can also reword the "Question (English)" column.'),
    para('•  Add Hindi and Hinglish translations in their columns. Blank cells are fine — the bot falls back to English.'),
    para('•  Do NOT change the ID column. That is how your text is matched back into the bot.'),
    para('•  Rows marked "Category" are menu headings (no answer). Rows marked "Question" are what people receive as replies.'),
    para(`•  Keep {curly placeholders} exactly as-is — the bot replaces them automatically:`),
    para(`     {contactEmail} = ${S.contactEmail || ''}   |   {website} = ${S.website || ''}`),
    para(`     {youtubeHindi} = ${S.youtubeHindi || ''}   |   {youtubeEnglish} = ${S.youtubeEnglish || ''}`),
    para(`     {youtubePlaylists} = ${S.youtubePlaylists || ''}   |   {instagram} = ${S.instagram || ''}   |   {name} = the person's name`),
    para('•  When done, save as .docx and send it back — we plug it straight into the bot.'),
    para('')
  ].join('');

  const sect = '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${intro}${table}${sect}</w:body>
</w:document>`;
}

function exportDoc(outPath) {
  const config = loadConfig(CONFIG_PATH);
  const out = path.resolve(outPath || DEFAULT_DOC);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgdoc-'));
  fs.mkdirSync(path.join(tmp, '_rels'));
  fs.mkdirSync(path.join(tmp, 'word'));

  fs.writeFileSync(path.join(tmp, '[Content_Types].xml'),
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  fs.writeFileSync(path.join(tmp, '_rels', '.rels'),
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  fs.writeFileSync(path.join(tmp, 'word', 'document.xml'), buildDocumentXml(config));

  try { fs.unlinkSync(out); } catch (e) { /* ignore */ }
  execSync(`zip -q -X -r "${out}" "[Content_Types].xml" "_rels" "word"`, { cwd: tmp });
  fs.rmSync(tmp, { recursive: true, force: true });

  const n = flatten(config).length;
  console.log(`✅ Exported ${n} rows to ${out}`);
  return out;
}

// ---------- IMPORT (parse edited .docx back into menu.json) ----------
function cellToText(cellXml) {
  return cellXml.split(/<\/w:p>/)
    .map(p => p.replace(/<w:tab\/>/g, ' ').replace(/<w:br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ''))
    .map(xmlDecode)
    .join('\n')
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseDocx(docxPath) {
  const xml = execSync(`unzip -p "${docxPath}" word/document.xml`, { maxBuffer: 1e8 }).toString('utf8');
  const tbl = (xml.match(/<w:tbl[ >][\s\S]*<\/w:tbl>/) || [])[0];
  if (!tbl) throw new Error('No table found in the document.');

  const trs = tbl.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || [];
  const rows = trs.map(tr => (tr.match(/<w:tc[ >][\s\S]*?<\/w:tc>/g) || []).map(cellToText));
  if (rows.length < 2) throw new Error('Table has no data rows.');

  // Map header names -> column index
  const header = rows[0].map(h => h.toLowerCase());
  const find = (pred) => header.findIndex(pred);
  const col = {
    id: find(h => h.trim() === 'id'),
    question: find(h => h.includes('question') || h.includes('label')),
    answer_en: find(h => h.includes('answer') && h.includes('english')),
    answer_hi: find(h => h.includes('answer') && h.includes('hindi')),
    answer_hinglish: find(h => h.includes('answer') && h.includes('hinglish'))
  };
  if (col.id === -1) throw new Error('Could not find an "ID" column in the table.');

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = (r[col.id] || '').trim();
    if (!id) continue;
    out.push({
      id,
      question: col.question > -1 ? r[col.question] : undefined,
      answer_en: col.answer_en > -1 ? r[col.answer_en] : undefined,
      answer_hi: col.answer_hi > -1 ? r[col.answer_hi] : undefined,
      answer_hinglish: col.answer_hinglish > -1 ? r[col.answer_hinglish] : undefined
    });
  }
  return out;
}

function importDoc(docxPath, outConfigPath) {
  const config = loadConfig(CONFIG_PATH);
  const index = {};
  (function bi(ns) { ns.forEach(n => { index[n.id] = n; if (n.children) bi(n.children); }); })(config.menu);

  const parsed = parseDocx(docxPath);
  let updated = 0, answers = 0, questions = 0, unknown = 0;

  for (const r of parsed) {
    const node = index[r.id];
    if (!node) { unknown++; continue; }
    let touched = false;

    if (r.question != null && r.question !== '' && r.question !== labelEn(node)) {
      node.label = node.label || {};
      node.label.en = r.question;
      questions++; touched = true;
    }
    // Only leaf/answer nodes take answers (categories are structure only)
    if (!isCategory(node)) {
      const set = (lang, val) => {
        if (val == null) return;
        const cur = node.answer && node.answer[lang] != null ? node.answer[lang] : '';
        if (val !== cur) { node.answer = node.answer || {}; node.answer[lang] = val; answers++; touched = true; }
      };
      set('en', r.answer_en);
      set('hi', r.answer_hi);
      set('hinglish', r.answer_hinglish);
    }
    if (touched) updated++;
  }

  const out = path.resolve(outConfigPath || CONFIG_PATH);
  // Back up the existing config before overwriting
  if (fs.existsSync(out)) {
    const bak = out + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.bak';
    fs.copyFileSync(out, bak);
    console.log(`🗂  Backed up existing config to ${path.basename(bak)}`);
  }
  fs.writeFileSync(out, JSON.stringify(config, null, 2) + '\n');
  console.log(`✅ Imported: ${updated} nodes updated (${questions} questions, ${answers} answer fields). ${unknown ? unknown + ' unknown IDs skipped.' : ''}`);
  console.log(`   Wrote ${out}`);
  return config;
}

module.exports = { exportDoc, importDoc, parseDocx, flatten };

// ---------- CLI ----------
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'export') {
    exportDoc(process.argv[3]);
  } else if (cmd === 'import') {
    if (!process.argv[3]) { console.error('Usage: node lib/menu-doc.js import <edited.docx> [outConfig.json]'); process.exit(1); }
    importDoc(process.argv[3], process.argv[4]);
  } else {
    console.log('Usage:\n  node lib/menu-doc.js export [outfile.docx]\n  node lib/menu-doc.js import <edited.docx> [outConfig.json]');
  }
}
