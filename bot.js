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

const logger = pino();

// ========== QR / CONNECTION STATE (for web QR page) ==========
let latestQR = null;       // most recent QR string emitted by Baileys
let isConnected = false;   // true once the bot is linked

// ========== WEB SERVER: scannable QR page ==========
// Renders the QR as a real image in the browser so it can be scanned reliably
// (Railway/terminal log output mangles the ASCII QR and is unscannable).
const webApp = express();

webApp.get('/', (req, res) => {
  res.send(isConnected ? '✅ MAAsterG bot is connected. <a href="/qr">QR page</a>' : '⏳ Starting… visit <a href="/qr">/qr</a> to link a device.');
});

// Lightweight JSON the QR page polls so it picks up QR rotation automatically
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
  console.log(`🌐 QR web page available at http://localhost:${WEB_PORT}/qr (and your Railway public URL + /qr)`);
});

// ========== MENU DATA STRUCTURE ==========
const menuData = {
  1: { // English
    language: 'English',
    greeting: '🙏 Welcome to MAAsterG Communication Team',
    languageMenu: `🙏 *MAAsterG Communication Team*\n\nPlease select your preferred language:\n\n1️⃣ English\n2️⃣ Hindi\n3️⃣ Hinglish`,
    mainMenu: `📱 How can I help you today?\n\n1️⃣ Know about MAAsterG\n2️⃣ What are Vaanis?\n3️⃣ Where can I listen to Vaanis\n4️⃣ What is the 30-Day Challenge\n5️⃣ I want to meet MAAsterG\n6️⃣ I want to organise an event\n7️⃣ I have questions for MAAsterG\n8️⃣ I want to attend an event or satsang\n9️⃣ Other query\n\n⬅️ Reply 0 to go BACK`,
    invalidInput: '❌ Invalid option. Please select 1-9 or 0 for menu.',
    responses: {
      1: `🌟 *MAAsterG*

MAAsterG is a Spiritual Life Master who has revolutionised the lives of lakhs of people through his Vaanis (lectures). MAAsterG attained enlightenment in 2007 and has been spreading his experiential wisdom for the past 18 years, completely free of cost and without donations.

🌐 Visit: www.maasterg.org

⬅️ Reply 0 for main menu`,
      2: `🎙️ *What are Vaanis?*

MAAsterG's Vaanis are lectures based on his own experience with Truth. MAAsterG says Vaanis are his PRAAN (life energy) that will take your negativity away and make you positive and happy.

📺 Listen FREE on YouTube:
• MAAsterG - https://www.youtube.com/@MAAsterG_GHJ
• MAAsterG English - https://www.youtube.com/@MAAsterGEnglish

⬅️ Reply 0 for main menu`,
      3: `🎧 *Where to Listen?*

📺 YouTube Channels:
• MAAsterG - https://www.youtube.com/@MAAsterG_GHJ
• MAAsterG English - https://www.youtube.com/@MAAsterGEnglish

📸 Instagram:
• Instagram.com/maasterg

🌐 Website: www.maasterg.org

⬅️ Reply 0 for main menu`,
      4: `🔥 *30-Day Challenge*

Listen to 30 lectures of MAAsterG on YouTube!

✨ MAAsterG GUARANTEES: When you listen regularly, no life incident—however difficult—will make you sad!

🚀 Start now:
https://www.youtube.com/@MAAsterG_GHJ/playlists

⬅️ Reply 0 for main menu`,
      5: `👋 *Meet MAAsterG*

📌 Before meeting, listen to at least 30 lectures.

Then choose:

A) Join mailing list for city visits & public events
📧 Reply: Yes

B) Spiritual Seekers - Request personal meeting
📧 Email: contact@maasterg.org

⬅️ Reply 0 for main menu`,
      6: `🎤 *Organise an Event*

We'd love to bring MAAsterG to your community!

📧 Email: contact@maasterg.org
Share your event details and we'll connect!

🌐 Visit: www.maasterg.org

⬅️ Reply 0 for main menu`,
      7: `❓ *Questions for MAAsterG?*

🔍 Search 1000+ lectures first
📺 YouTube: https://www.youtube.com/@MAAsterG_GHJ

If your question is not covered:
📧 Email: contact@maasterg.org

A Vaani will be recorded & posted on YouTube!

⬅️ Reply 0 for main menu`,
      8: `🤝 *Join Our Community*

📌 Listen to 30+ lectures first

Then join your local group:
👉 Reply: Yes, I want to join

Share: Your Name, City, Contact Number

Our representatives will reach out!

⬅️ Reply 0 for main menu`,
      9: `💬 *Other Query*

📧 Email: contact@maasterg.org
🌐 Visit: www.maasterg.org

We'll respond promptly!

⬅️ Reply 0 for main menu`
    }
  },
  2: { // Hindi
    language: 'Hindi',
    greeting: '🙏 मास्टरG कम्युनिकेशन टीम में आपका स्वागत है',
    languageMenu: `🙏 *मास्टरG कम्युनिकेशन टीम*\n\nकृपया अपनी पसंदीदा भाषा चुनें:\n\n1️⃣ अंग्रेजी\n2️⃣ हिंदी\n3️⃣ हिंग्लिश`,
    mainMenu: `📱 मैं आपकी कैसे मदद कर सकता हूं?\n\n1️⃣ मास्टरG के बारे में जानें\n2️⃣ वाणियाँ क्या हैं?\n3️⃣ वाणियाँ कहां सुन सकते हैं\n4️⃣ 30 दिन की चुनौती क्या है\n5️⃣ मैं मास्टरG से मिलना चाहता हूं\n6️⃣ मैं एक इवेंट आयोजित करना चाहता हूं\n7️⃣ मेरे पास मास्टरG के लिए सवाल हैं\n8️⃣ मैं एक इवेंट या सत्संग में भाग लेना चाहता हूं\n9️⃣ अन्य सवाल\n\n⬅️ मुख्य मेनू के लिए 0 दबाएं`,
    invalidInput: '❌ अमान्य विकल्प। कृपया 1-9 या मेनू के लिए 0 चुनें।',
    responses: {
      1: `🌟 *मास्टरG*

मास्टरG एक आध्यात्मिक जीवन गुरु हैं जिन्होंने अपनी वाणियों (व्याख्यानों) के माध्यम से लाखों लोगों के जीवन में क्रांति ला दी है। मास्टरG को 2007 में ज्ञान की प्राप्ति हुई और वे पिछले 18 सालों से अपना आध्यात्मिक ज्ञान पूरी तरह मुफ्त और बिना दान के साझा कर रहे हैं।

🌐 विजिट करें: www.maasterg.org

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      2: `🎙️ *वाणियाँ क्या हैं?*

मास्टरG की वाणियाँ उनके अपने सत्य के अनुभव पर आधारित व्याख्यान हैं। मास्टरG कहते हैं कि वाणियाँ उनकी जीवन ऊर्जा (प्राण) हैं जो आपकी नकारात्मकता को दूर करके आपको सकारात्मक और खुश बना देंगी।

📺 YouTube पर मुफ्त सुनें:
• मास्टरG - https://www.youtube.com/@MAAsterG_GHJ
• MAAsterG English - https://www.youtube.com/@MAAsterGEnglish

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      3: `🎧 *वाणियाँ कहां सुन सकते हैं?*

📺 YouTube चैनल:
• मास्टरG - https://www.youtube.com/@MAAsterG_GHJ
• MAAsterG English - https://www.youtube.com/@MAAsterGEnglish

📸 Instagram:
• Instagram.com/maasterg

🌐 वेबसाइट: www.maasterg.org

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      4: `🔥 *30 दिन की चुनौती*

YouTube पर मास्टरG की 30 वाणियाँ सुनें!

✨ मास्टरG की गारंटी: जब आप नियमित रूप से वाणी सुनते हैं, तो कोई भी जीवन घटना आपको दुखी नहीं कर सकती!

🚀 अभी शुरू करें:
https://www.youtube.com/@MAAsterG_GHJ/playlists

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      5: `👋 *मास्टरG से मिलना*

📌 मिलने से पहले कम से कम 30 वाणियाँ सुनें।

फिर चुनें:

A) शहर की यात्रा और सार्वजनिक इवेंट की जानकारी के लिए मेलिंग लिस्ट में शामिल हों
📧 जवाब दें: हाँ

B) आध्यात्मिक साधक - व्यक्तिगत रूप से मिलने का अनुरोध करें
📧 ईमेल: contact@maasterg.org

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      6: `🎤 *एक इवेंट आयोजित करें*

हम अपने समुदाय में मास्टरG को लाना चाहेंगे!

📧 ईमेल: contact@maasterg.org
अपने इवेंट विवरण साझा करें और हम आपको जोड़ेंगे!

🌐 विजिट करें: www.maasterg.org

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      7: `❓ *मास्टरG के लिए सवाल हैं?*

🔍 पहले 1000+ व्याख्यानों में खोजें
📺 YouTube: https://www.youtube.com/@MAAsterG_GHJ

यदि आपका सवाल कवर नहीं है:
📧 ईमेल: contact@maasterg.org

एक वाणी रिकॉर्ड की जाएगी और YouTube पर पोस्ट की जाएगी!

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      8: `🤝 *हमारे समुदाय में शामिल हों*

📌 पहले 30+ वाणियाँ सुनें

फिर अपने स्थानीय समूह में शामिल हों:
👉 जवाब दें: हाँ, मैं शामिल होना चाहता हूं

साझा करें: आपका नाम, शहर, संपर्क नंबर

हमारे प्रतिनिधि आपसे संपर्क करेंगे!

⬅️ मुख्य मेनू के लिए 0 दबाएं`,
      9: `💬 *अन्य सवाल*

📧 ईमेल: contact@maasterg.org
🌐 विजिट करें: www.maasterg.org

हम तुरंत जवाब देंगे!

⬅️ मुख्य मेनू के लिए 0 दबाएं`
    }
  },
  3: { // Hinglish
    language: 'Hinglish',
    greeting: '🙏 Welcome to MAAsterG Communication Team',
    languageMenu: `🙏 *MAAsterG Communication Team*\n\nAapni pasand ki language chune:\n\n1️⃣ English\n2️⃣ Hindi\n3️⃣ Hinglish`,
    mainMenu: `📱 Main aapki kaise madad kar sakta hoon?\n\n1️⃣ MAAsterG ke baare mein jaane\n2️⃣ Vaanis kya hain?\n3️⃣ Vaanis kahan sun sakte ho\n4️⃣ 30 din ki challenge kya hai\n5️⃣ Mein MAAsterG se milna chahta/chahti hoon\n6️⃣ Mein event organize karna chahta/chahti hoon\n7️⃣ Mere paas MAAsterG ke liye sawaal hain\n8️⃣ Mein event ya satsang mein shamil hona chahta/chahti hoon\n9️⃣ Koi aur sawaal\n\n⬅️ Main menu ke liye 0 dabayen`,
    invalidInput: '❌ Galat option. Kripya 1-9 ya menu ke liye 0 chune.',
    responses: {
      1: `🌟 *MAAsterG*

MAAsterG ek Spiritual Life Master hain jo apni Vaanis (lectures) ke zariye lakhs logo ke jeevan mein inqilaab laye hain. MAAsterG ko 2007 mein enlightenment mila aur woh pichle 18 saalo se apna spiritual knowledge bilkul free aur bina donation ke share kar rahe hain.

🌐 Visit kare: www.maasterg.org

⬅️ Main menu ke liye 0 dabayen`,
      2: `🎙️ *Vaanis Kya Hain?*

MAAsterG ki Vaanis unke apne Truth ke experience par based lectures hain. MAAsterG kehte hain ki Vaanis unki PRAAN (life energy) hain jo aapki negativity ko remove karke aapko positive aur khush bana dengi.

📺 YouTube par free suno:
• MAAsterG - https://www.youtube.com/@MAAsterG_GHJ
• MAAsterG English - https://www.youtube.com/@MAAsterGEnglish

⬅️ Main menu ke liye 0 dabayen`,
      3: `🎧 *Vaanis Kahan Sun Sakte Ho?*

📺 YouTube Channels:
• MAAsterG - https://www.youtube.com/@MAAsterG_GHJ
• MAAsterG English - https://www.youtube.com/@MAAsterGEnglish

📸 Instagram:
• Instagram.com/maasterg

🌐 Website: www.maasterg.org

⬅️ Main menu ke liye 0 dabayen`,
      4: `🔥 *30 Din Ki Challenge*

YouTube par MAAsterG ki 30 Vaanis suno!

✨ MAAsterG ki Guarantee: Jab aap regularly Vaani suno, toh koi bhi life incident aapko sad nahi kar sakti!

🚀 Abhi shuru karo:
https://www.youtube.com/@MAAsterG_GHJ/playlists

⬅️ Main menu ke liye 0 dabayen`,
      5: `👋 *MAAsterG Se Milna*

📌 Milne se pehle kam se kam 30 Vaanis suno.

Phir choose karo:

A) Mailing list mein shamil ho kar city visit aur events ki jaankari pao
📧 Jawab do: Haan

B) Spiritual Seekers - MAAsterG se personally milne ke liye request karo
📧 Email: contact@maasterg.org

⬅️ Main menu ke liye 0 dabayen`,
      6: `🎤 *Event Organize Karo*

Hum apne community mein MAAsterG ko lana chahte hain!

📧 Email: contact@maasterg.org
Apne event details share karo aur hum contact karengi!

🌐 Visit kare: www.maasterg.org

⬅️ Main menu ke liye 0 dabayen`,
      7: `❓ *MAAsterG Ke Liye Sawal?*

🔍 Pehle 1000+ lectures mein dhundo
📺 YouTube: https://www.youtube.com/@MAAsterG_GHJ

Agar aapka sawaal cover nahi hua hai:
📧 Email: contact@maasterg.org

Ek Vaani record ki jayegi aur YouTube par post ki jayegi!

⬅️ Main menu ke liye 0 dabayen`,
      8: `🤝 *Hamare Community Mein Shamil Ho*

📌 Pehle 30+ Vaanis suno

Phir apne local group mein shamil ho:
👉 Jawab do: Haan, main shamil hona chahta/chahti hoon

Share karo: Aapka Naam, City, Contact Number

Hamare representatives aapko contact karengi!

⬅️ Main menu ke liye 0 dabayen`,
      9: `💬 *Koi Aur Sawal*

📧 Email: contact@maasterg.org
🌐 Visit kare: www.maasterg.org

Hum turant jawab dengi!

⬅️ Main menu ke liye 0 dabayen`
    }
  }
};

// User session storage (in-memory)
const userSessions = {};

let sock;

// ========== MAIN BOT FUNCTION ==========
async function connectToWhatsApp() {
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
      console.log('\n🌐 Or open the scannable web QR:  <your-railway-url>/qr');
      console.log('⏳ QR Code refreshes automatically until scanned\n');
    }

    if (connection === 'close') {
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
      latestQR = null;
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║    ✅ BOT CONNECTED & READY! ✅       ║');
      console.log('╚════════════════════════════════════════╝\n');
      console.log('🤖 MAAsterG Bot is now LIVE\n');
      console.log('📊 Waiting for incoming messages...\n');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg.message) return;
      if (msg.key.fromMe) return;

      const sender = msg.key.remoteJid;
      const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim().toLowerCase();

      const timestamp = new Date().toLocaleString();
      console.log(`\n📨 [${timestamp}]`);
      console.log(`   From: ${sender}`);
      console.log(`   Message: ${text}`);

      // Initialize user session if new
      if (!userSessions[sender]) {
        userSessions[sender] = { stage: 'language', language: null };
        console.log(`   🆕 New user initialized\n`);
      }

      const session = userSessions[sender];

      // ===== STAGE 1: LANGUAGE SELECTION =====
      if (session.stage === 'language') {
        if (['1', '2', '3'].includes(text)) {
          session.language = parseInt(text);
          session.stage = 'mainMenu';
          
          const selectedLang = menuData[session.language].language;
          const mainMenuText = menuData[session.language].mainMenu;
          
          await sock.sendMessage(sender, { text: mainMenuText });
          console.log(`   ✅ Language selected: ${selectedLang}`);
          console.log(`   ➡️  Sent main menu\n`);
          return;
        } else {
          const langMenu = menuData[1].languageMenu;
          await sock.sendMessage(sender, { text: langMenu });
          console.log(`   ✅ Sent language selection menu\n`);
          return;
        }
      }

      // ===== STAGE 2: MAIN MENU =====
      if (session.stage === 'mainMenu') {
        // Back to language selection
        if (text === '0') {
          session.stage = 'language';
          const langMenu = menuData[session.language].languageMenu;
          await sock.sendMessage(sender, { text: langMenu });
          console.log(`   ➡️  Returned to language selection\n`);
          return;
        }

        // Main menu options
        const responseNum = parseInt(text);
        if (responseNum >= 1 && responseNum <= 9) {
          const response = menuData[session.language]?.responses?.[responseNum];
          
          if (response) {
            await sock.sendMessage(sender, { text: response });
            console.log(`   ✅ Sent response for option ${responseNum}\n`);
            return;
          }
        }

        // Invalid input
        const invalidMsg = menuData[session.language].invalidInput;
        await sock.sendMessage(sender, { text: invalidMsg });
        console.log(`   ❌ Invalid option, sent error message\n`);
        return;
      }

    } catch (error) {
      console.error('❌ Error processing message:', error.message);
    }
  });
}

// ========== ERROR HANDLING ==========
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  setTimeout(() => {
    console.log('🔄 Attempting to reconnect...');
    connectToWhatsApp();
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📴 Bot shutting down gracefully...');
  process.exit(0);
});
