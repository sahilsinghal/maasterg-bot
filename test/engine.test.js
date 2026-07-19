// Headless test of the conversation engine — no WhatsApp, no network.
// Run: node test/engine.test.js
const path = require('path');
const { Engine, loadConfig } = require('../lib/engine');

const config = loadConfig(path.join(__dirname, '..', 'config', 'menu.json'));

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('  ❌ FAIL:', msg); } }
function lastReply(r) { return r.replies[r.replies.length - 1]; }

// ---- 1. Config integrity ----
(function configIntegrity() {
  const seen = new Set();
  const answered = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      ok(!seen.has(n.id), `duplicate node id ${n.id}`);
      seen.add(n.id);
      ok(!!n.label, `node ${n.id} missing label`);
      const kids = n.ref ? (config.menu, true) : n.children;
      const isLeaf = !n.children && !n.ref;
      if (isLeaf) { ok(!!n.answer, `leaf ${n.id} missing answer`); answered.push(n.id); }
      if (n.children) walk(n.children);
    }
  };
  walk(config.menu);
  // every ref target exists
  const idx = {}; const bi = (ns) => ns.forEach(n => { idx[n.id] = n; if (n.children) bi(n.children); }); bi(config.menu);
  const checkRef = (ns) => ns.forEach(n => { if (n.ref) ok(!!idx[n.ref], `ref ${n.ref} on ${n.id} not found`); if (n.children) checkRef(n.children); });
  checkRef(config.menu);
  console.log(`Config: ${seen.size} nodes, ${answered.length} answered leaves`);
})();

// ---- 2. Full conversation flow ----
(function conversation() {
  const engine = new Engine(config); // no store
  const s = engine.newSession();
  const jid = 'test@s.whatsapp.net';

  // first contact -> welcome + language prompt
  let r = engine.handle(s, 'hi', jid);
  ok(r.replies.length === 2, 'first contact returns welcome + language');
  ok(s.stage === 'language', 'stage is language after welcome');

  // choose Hindi by number
  r = engine.handle(s, '2', jid);
  ok(s.language === 'hi', 'language set to hi via "2"');
  ok(s.stage === 'askName', 'moves to askName');

  // name (should NOT be treated as a command even if it looks like one)
  r = engine.handle(s, 'menu', jid);
  ok(s.name === 'menu', 'name captured literally ("menu" not treated as command)');
  ok(s.stage === 'askCity', 'moves to askCity');

  // skip city
  r = engine.handle(s, 'skip', jid);
  ok(s.city === null, 'city skipped');
  ok(s.stage === 'browse' && s.path.length === 0, 'lands on main menu');
  ok(lastReply(r).includes('1️⃣'), 'main menu is numbered');

  // pick category 1 (Clarity) by number
  r = engine.handle(s, '1', jid);
  ok(s.path[s.path.length - 1] === '2.1', 'opened 2.1 Clarity');
  ok(lastReply(r).includes('BACK') || lastReply(r).toLowerCase().includes('back') || lastReply(r).includes('back'), 'submenu shows back options');

  // pick a leaf by number -> answer
  r = engine.handle(s, '1', jid);
  ok(s.view === 'answer', 'leaf 2.1.1 shows an answer');
  ok(lastReply(r).length > 20, 'answer has content');

  // back from an answer -> returns to the SAME menu (2.1), not up a level
  r = engine.handle(s, 'back', jid);
  ok(s.path[s.path.length - 1] === '2.1', 'back from answer stays at 2.1 menu');
  ok(s.view === 'menu', 'view is menu again');

  // back from a menu -> up to main
  r = engine.handle(s, 'back', jid);
  ok(s.path.length === 0, 'back from 2.1 goes to main');

  // free-text keyword navigation ("vaani")
  r = engine.handle(s, 'about maasterg', jid);
  ok(s.path[s.path.length - 1] === '2.3', 'keyword "about maasterg" opened 2.3');

  // menu command jumps to main from anywhere
  r = engine.handle(s, 'menu', jid);
  ok(s.path.length === 0, 'menu command returns to main');

  // ref reuse: navigate 2.3 -> 2.3.9 (Help me find Vaanis) -> reuse of 2.1
  engine.handle(s, '3', jid);            // 2.3
  const node23 = engine.currentNode(s);
  ok(node23.id === '2.3', 'at 2.3');
  // find index of 2.3.9 in children
  const kids = engine.childrenOf(node23);
  const idx239 = kids.findIndex(k => k.id === '2.3.9') + 1;
  engine.handle(s, String(idx239), jid); // 2.3.9
  const help = engine.currentNode(s);
  const helpKids = engine.childrenOf(help);
  const refChild = helpKids.find(k => k.ref === '2.1');
  ok(!!refChild, '2.3.9 has a child that refs 2.1');
  // open the ref child -> should show 2.1's children
  const refIdx = helpKids.indexOf(refChild) + 1;
  const rr = engine.handle(s, String(refIdx), jid);
  ok(engine.childrenOf(engine.currentNode(s)).length === 10, 'ref resolves to 2.1 ten children');

  // invalid input re-shows menu
  const before = s.path.slice();
  const ri = engine.handle(s, 'zzzzz nonsense', jid);
  ok(lastReply(ri).length > 0 && JSON.stringify(s.path) === JSON.stringify(before), 'invalid input keeps location');

  // placeholder interpolation worked somewhere (email appears in a fallback/answer)
  const s2 = engine.newSession();
  engine.handle(s2, 'hi', jid); engine.handle(s2, '1', jid); // english
  engine.handle(s2, 'Ram', jid); engine.handle(s2, 'skip', jid);
  engine.handle(s2, '3', jid);   // About MAAsterG & Work
  // drill to Media contact details to check {contactEmail} interpolation
  const top = engine.currentNode(s2);
  const mIdx = engine.childrenOf(top).findIndex(k => k.id === '2.3.6') + 1;
  engine.handle(s2, String(mIdx), jid);
  const mediaKids = engine.childrenOf(engine.currentNode(s2));
  const detIdx = mediaKids.findIndex(k => k.id === '2.3.6.3') + 1;
  const mr = engine.handle(s2, String(detIdx), jid);
  ok(lastReply(mr).includes('contact@maasterg.org'), '{contactEmail} placeholder interpolated');

  console.log('Conversation flow exercised.');
})();

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
