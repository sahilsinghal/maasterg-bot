// Load environment variables from .env (e.g. GOOGLE_SHEET_WEBHOOK_URL)
require('dotenv').config();

// Polyfill Web Crypto API global for Node < 20 (Baileys requires globalThis.crypto)
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto').webcrypto;
}

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Store } = require('./lib/store');
const { Engine, loadConfig } = require('./lib/engine');

// ========== CONFIG + ENGINE ==========
// All menu text/questions/answers live in config/menu.json — edit that file to
// change wording, add questions, or restructure the menu (no code changes).
const CONFIG_PATH = path.join(__dirname, 'config', 'menu.json');
const store = new Store(loadConfig(CONFIG_PATH).settings);
const engine = new Engine(loadConfig(CONFIG_PATH), store);

// Hot-reload menu.json on change (edits take effect without a restart)
try {
  fs.watchFile(CONFIG_PATH, { interval: 2000 }, () => {
    try {
      engine.setConfig(loadConfig(CONFIG_PATH));
      console.log('♻️  Reloaded config/menu.json');
    } catch (e) {
      console.error('⚠️  menu.json reload failed (keeping previous):', e.message);
    }
  });
} catch (e) { /* ignore */ }

// ========== SESSIONS (in-memory conversation state) ==========
const userSessions = {};

// ========== QR / CONNECTION STATE (for web QR page) ==========
let latestQR = null;
let isConnected = false;

// ========== WEB SERVER: scannable QR page ==========
const webApp = express();

webApp.get('/', (req, res) => {
  res.send(isConnected ? '✅ MAAsterG bot is connected. <a href="/qr">QR page</a>' : '⏳ Starting… visit <a href="/qr">/qr</a> to link a device.');
});

webApp.get('/qr.json', (req, res) => {
  res.json({ qr: latestQR, connected: isConnected });
});

webApp.get('/qr', (req, res) => {
  res.type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>MAAsterG — Link Device</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:24px;background:#fff;color:#222}
#qr{display:inline-block;margin:16px auto;padding:16px;background:#fff;border:1px solid #eee;border-radius:12px}
.muted{color:#888;font-size:14px}</style></head>
<body>
<h2>🙏 MAAsterG — Link a Device</h2>
<p class="muted">On your phone: WhatsApp → Settings → Linked Devices → Link a Device → scan below</p>
<div id="qr"></div>
<p id="status" class="muted">Loading…</p>
<script>
let rendered = null;
function draw(text){
  const box = document.getElementById('qr');
  box.innerHTML = '';
  new QRCode(box, { text: text, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.L });
}
async function tick(){
  try{
    const r = await fetch('/qr.json', {cache:'no-store'});
    const d = await r.json();
    const s = document.getElementById('status');
    if (d.connected){ s.textContent = '✅ Connected! You can close this page.'; document.getElementById('qr').innerHTML='✅'; return; }
    if (d.qr && d.qr !== rendered){ rendered = d.qr; draw(d.qr); s.textContent = 'Scan this code (it refreshes automatically).'; }
    else if (!d.qr){ s.textContent = 'Waiting for QR… (bot may already be linked or still starting)'; }
  }catch(e){ document.getElementById('status').textContent = 'Error fetching QR: ' + e.message; }
}
setInterval(tick, 2000); tick();
</script>
</body></html>`);
});

const WEB_PORT = process.env.PORT || 3000;
webApp.listen(WEB_PORT, () => {
  console.log(`🌐 QR web page available at http://localhost:${WEB_PORT}/qr (and your server's public IP/URL + /qr)`);
});

let sock;
let isConnecting = false;

// Dedupe recently handled message IDs so a single message is never answered twice
const processedMessages = new Set();
function alreadyHandled(id) {
  if (!id) return false;
  if (processedMessages.has(id)) return true;
  processedMessages.add(id);
  if (processedMessages.size > 1000) processedMessages.clear();
  return false;
}

// ========== MAIN BOT FUNCTION ==========
async function connectToWhatsApp() {
  if (isConnecting) {
    console.log('⏳ Connection attempt already in progress — skipping duplicate.');
    return;
  }
  isConnecting = true;

  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end();
    } catch (e) { /* ignore */ }
    sock = null;
  }

  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📦 Using WhatsApp Web version ${version.join('.')} (latest: ${isLatest})`);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    logger: pino({ level: 'silent' }),
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR = qr;
      isConnected = false;
      console.log('\n\n╔════════════════════════════════════════╗');
      console.log('║   📱 SCAN QR CODE WITH WHATSAPP 📱    ║');
      console.log('╚════════════════════════════════════════╝\n');
      qrcode.generate(qr, { small: true });
      console.log('\n🌐 Or open the scannable web QR:  http://<your-server-ip>:' + WEB_PORT + '/qr');
      console.log('⏳ QR Code refreshes automatically until scanned\n');
    }

    if (connection === 'close') {
      isConnecting = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log('🔎 Disconnect reason:', statusCode, '| message:', lastDisconnect?.error?.message);
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔄 Connection lost. Reconnecting...');
        setTimeout(() => connectToWhatsApp(), 3000);
      } else {
        console.log('❌ Connection closed. Please restart the bot.');
      }
    }

    if (connection === 'open') {
      isConnected = true;
      isConnecting = false;
      latestQR = null;
      const s = store.stats();
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║    ✅ BOT CONNECTED & READY! ✅       ║');
      console.log('╚════════════════════════════════════════╝\n');
      console.log('🤖 MAAsterG Bot is now LIVE');
      console.log(`👥 Known people: ${s.totalPeople} (named: ${s.withName})\n`);
      console.log('📊 Waiting for incoming messages...\n');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    try {
      if (m.type !== 'notify') return;

      const msg = m.messages[0];
      if (!msg || !msg.message) return;
      if (msg.key.fromMe) return;

      if (alreadyHandled(msg.key.id)) {
        console.log('   🔁 Duplicate message skipped:', msg.key.id);
        return;
      }

      const sender = msg.key.remoteJid;

      // Respond ONLY to one-to-one direct messages.
      if (!sender || sender.endsWith('@g.us') || sender.endsWith('@broadcast') || sender.endsWith('@newsletter')) {
        return;
      }

      const raw = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
      console.log(`\n📨 [${new Date().toLocaleString()}] From: ${sender} | "${raw}"`);

      if (!userSessions[sender]) userSessions[sender] = engine.newSession();
      const session = userSessions[sender];

      // Drive the pure engine, then send whatever replies it produced.
      const { replies, log } = engine.handle(session, raw, sender);
      for (const reply of replies) {
        if (reply) await sock.sendMessage(sender, { text: reply });
      }
      console.log(`   → ${log}`);

    } catch (error) {
      console.error('❌ Error processing message:', error.message);
    }
  });
}

// ========== ERROR HANDLING ==========
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled Rejection:', reason);
});

// ========== START BOT ==========
console.log('\n╔════════════════════════════════════════╗');
console.log('║     🙏 MAAsterG WhatsApp Bot 🙏       ║');
console.log('║           Starting...                 ║');
console.log('╚════════════════════════════════════════╝\n');

connectToWhatsApp().catch(err => {
  console.error('❌ Failed to start bot:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n📴 Bot shutting down gracefully...');
  process.exit(0);
});
