// ============================================================================
// Pure conversation engine for the MAAsterG bot.
//
// No WhatsApp / no network here — just: given a session + a raw user message,
// mutate the session and return the reply string(s). This makes the whole
// conversation flow unit-testable (see test/engine.test.js).
//
// Session shape:
//   { stage, language, name, city, path: [nodeId...], view, welcomed }
//   stage: 'language' | 'askName' | 'askCity' | 'browse'
//   path : current location in the tree ([] = main menu)
//   view : 'menu' | 'answer' (so "back" behaves correctly after an answer)
// ============================================================================

const fs = require('fs');

function loadConfig(configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// A store that does nothing — used in tests or when persistence is disabled.
const noopStore = {
  getOrCreate() {}, recordMessage() {}, updateProfile() {}, addInterest() {}, setLastTopic() {},
  stats() { return { totalPeople: 0, withName: 0, withCity: 0 }; }
};

class Engine {
  constructor(config, store) {
    this.config = config;
    this.store = store || noopStore;
    this.S = config.settings;
    this.rebuildIndex();
  }

  setConfig(config) { this.config = config; this.S = config.settings; this.rebuildIndex(); }

  rebuildIndex() {
    this.nodeIndex = {};
    const idx = (nodes) => { for (const n of nodes) { this.nodeIndex[n.id] = n; if (n.children) idx(n.children); } };
    idx(this.config.menu);
  }

  // ---- tree helpers ----
  childrenOf(node) {
    if (!node) return this.config.menu;
    if (node.ref && this.nodeIndex[node.ref]) return this.nodeIndex[node.ref].children || [];
    return node.children || [];
  }
  isMenu(node) { return this.childrenOf(node).length > 0; }
  currentNode(session) { return session.path.length ? this.nodeIndex[session.path[session.path.length - 1]] : null; }
  currentChildren(session) { return this.childrenOf(this.currentNode(session)); }

  // ---- text helpers (language fallback + {placeholder}) ----
  pick(obj, lang) {
    if (!obj) return null;
    if (obj[lang] != null) return obj[lang];
    if (obj[this.S.fallbackLanguage] != null) return obj[this.S.fallbackLanguage];
    const vals = Object.values(obj);
    return vals.length ? vals[0] : null;
  }
  interpolate(str, extra = {}) {
    if (str == null) return str;
    return str.replace(/\{(\w+)\}/g, (m, key) => {
      if (extra[key] != null) return extra[key];
      if (this.S[key] != null) return this.S[key];
      return m;
    });
  }
  text(obj, lang, extra) {
    const v = this.pick(obj, lang);
    return v == null ? null : this.interpolate(v, extra);
  }

  // ---- input parsing ----
  normalize(s) { return (s || '').toLowerCase().replace(/[*_~`]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  detectLanguage(input) {
    const n = this.normalize(input);
    if (!n) return null;
    for (const l of this.config.languages) {
      for (const a of (l.aliases || [])) {
        const na = this.normalize(a);
        if (!na) continue;
        if (n === na) return l.code;
        if (na.length >= 3 && n.includes(na)) return l.code;
      }
    }
    return null;
  }

  detectCommand(input) {
    const n = this.normalize(input);
    for (const [cmd, words] of Object.entries(this.config.commands || {})) {
      if ((words || []).some(w => this.normalize(w) === n)) return cmd;
    }
    return null;
  }

  matchFromList(list, input) {
    const n = this.normalize(input);
    if (!n) return null;
    if (/^\d+$/.test(n)) {
      const idx = parseInt(n, 10) - 1;
      return (idx >= 0 && idx < list.length) ? list[idx] : null;
    }
    if (this.S.allowFreeText) {
      for (const k of list) {
        if ((k.keywords || []).some(kw => n.includes(this.normalize(kw)))) return k;
      }
      for (const k of list) {
        const lbl = this.normalize(this.pick(k.label, this.S.fallbackLanguage) || '');
        if (lbl && n.length >= 3 && lbl.includes(n)) return k;
      }
    }
    return null;
  }

  // ---- rendering ----
  numLabel(i) {
    const KEYCAPS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return i < 10 ? KEYCAPS[i] : `*${i + 1}.*`;
  }
  renderList(list, lang) { return list.map((n, i) => `${this.numLabel(i)} ${this.text(n.label, lang)}`).join('\n'); }
  backSuffix(session, lang) { return session.path.length ? this.text(this.config.prompts.backOptions, lang) : ''; }

  mainMenu(session) {
    session.stage = 'browse'; session.path = []; session.view = 'menu';
    const lang = session.language || this.S.defaultLanguage;
    const title = this.text(this.config.prompts.mainMenuTitle, lang, { name: session.name || '' });
    return `${title}\n\n${this.renderList(this.config.menu, lang)}`;
  }
  currentMenu(session) {
    session.view = 'menu';
    const lang = session.language || this.S.defaultLanguage;
    const node = this.currentNode(session);
    if (!node) return this.mainMenu(session);
    const title = this.text(this.config.prompts.submenuTitle, lang, { title: this.text(node.label, lang) });
    return `${title}\n\n${this.renderList(this.childrenOf(node), lang)}${this.backSuffix(session, lang)}`;
  }
  answer(session, node) {
    session.view = 'answer';
    const lang = session.language || this.S.defaultLanguage;
    let ans = this.text(node.answer, lang);
    if (!ans) ans = this.text(this.config.prompts.notAnswered, lang);
    return `${ans}${this.text(this.config.prompts.backOptions, lang)}`;
  }

  // Create a fresh session object.
  newSession() {
    return { stage: 'language', language: null, name: null, city: null, path: [], view: 'menu', welcomed: false };
  }

  // ---- main reducer ----
  // Returns { replies: [strings], log: '...' } and mutates `session`.
  handle(session, rawInput, jid) {
    const raw = (rawInput || '').trim();
    const uiLang = session.language || this.S.defaultLanguage;
    const P = this.config.prompts;
    this.store.recordMessage(jid); // metadata only: bump lastSeen + messageCount

    // First contact
    if (!session.welcomed) {
      session.welcomed = true;
      session.stage = 'language';
      return { replies: [this.text(P.welcome, uiLang), this.text(P.askLanguage, uiLang)], log: 'welcome' };
    }

    // Stage: language
    if (session.stage === 'language') {
      const lang = this.detectLanguage(raw);
      if (lang) {
        session.language = lang;
        this.store.updateProfile(jid, { language: lang });
        if (this.S.collectProfile) { session.stage = 'askName'; return { replies: [this.text(P.askName, lang)], log: `lang=${lang}` }; }
        return { replies: [this.mainMenu(session)], log: `lang=${lang}` };
      }
      return { replies: [`${this.text(P.languageInvalid, uiLang)}\n\n${this.text(P.askLanguage, uiLang)}`], log: 'lang-invalid' };
    }

    // Stage: ask name (input is the name, never a command)
    if (session.stage === 'askName') {
      session.name = raw || null;
      this.store.updateProfile(jid, { name: session.name });
      session.stage = 'askCity';
      return { replies: [this.text(P.askCity, uiLang, { name: session.name || '' })], log: `name=${session.name}` };
    }

    // Stage: ask city (optional)
    if (session.stage === 'askCity') {
      const n = this.normalize(raw);
      const skip = (P.citySkipWords || []).map(w => this.normalize(w)).includes(n);
      if (!skip && raw) { session.city = raw; this.store.updateProfile(jid, { city: raw }); }
      return { replies: [this.mainMenu(session)], log: `city=${session.city || '(skipped)'}` };
    }

    // Stage: browse
    const cmd = this.detectCommand(raw);
    if (cmd === 'help') return { replies: [this.text(P.help, uiLang)], log: 'help' };
    if (cmd === 'language') { session.stage = 'language'; return { replies: [this.text(P.askLanguage, uiLang)], log: 'lang-menu' }; }
    if (cmd === 'menu') return { replies: [this.mainMenu(session)], log: 'main' };
    if (cmd === 'back') {
      if (session.view === 'answer') return { replies: [this.currentMenu(session)], log: 'back-to-menu' };
      session.path.pop();
      return { replies: [session.path.length ? this.currentMenu(session) : this.mainMenu(session)], log: 'back' };
    }

    const options = this.currentChildren(session);
    const chosen = this.matchFromList(options, raw);
    if (chosen) {
      const labelEn = this.text(chosen.label, this.S.fallbackLanguage);
      if (this.isMenu(chosen)) {
        // If it's one of the top-level L2 categories, record it as an interest.
        if (this.config.menu.some(c => c.id === chosen.id)) this.store.addInterest(jid, labelEn);
        session.path.push(chosen.id);
        return { replies: [this.currentMenu(session)], log: `open ${chosen.id}` };
      }
      this.store.setLastTopic(jid, labelEn);
      return { replies: [this.answer(session, chosen)], log: `answer ${chosen.id}` };
    }

    const lang = uiLang;
    return { replies: [`${this.text(P.invalid, lang)}\n\n${this.renderList(options, lang)}${this.backSuffix(session, lang)}`], log: 'invalid' };
  }
}

module.exports = { Engine, loadConfig, noopStore };
