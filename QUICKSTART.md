# 🚀 Quick Start - 10 Minutes to Live Bot

**For experienced developers only. For detailed guide, see [SETUP.md](./SETUP.md)**

---

## 1️⃣ Prerequisites (Check These)

```bash
node --version    # Should be v18+
npm --version     # Should be v8+
git --version     # Optional but recommended
```

---

## 2️⃣ Clone & Install

```bash
# Clone this repo
git clone https://github.com/yourusername/maasterg-bot.git
cd maasterg-bot

# Or download ZIP and extract

# Install dependencies
npm install
```

---

## 3️⃣ Run Locally

```bash
npm start
```

**You'll see:**
```
📱 SCAN QR CODE WITH WHATSAPP 📱

[ASCII QR CODE]

✋ Do NOT close terminal!
```

---

## 4️⃣ Scan QR Code

1. Open WhatsApp on phone
2. Go to **Settings → Linked Devices → Link Device**
3. Scan QR code from terminal
4. Wait for: **✅ BOT CONNECTED & READY!**

---

## 5️⃣ Test Bot

Send any message to your bot number. You should get language selection menu.

---

## 6️⃣ Deploy to Railway (Optional)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up

# View logs
railway logs --follow
```

Done! 🎉

---

## 📁 Project Files

| File | What it does |
|------|-------------|
| `bot.js` | Main bot code |
| `package.json` | Dependencies |
| `.env` | Configuration |
| `auth_info/` | WhatsApp session (auto-created, keep private!) |

---

## 🔧 Customize Menu

Edit `bot.js`, find `menuData` object, change responses:

```javascript
1: "Your new response here"
2: "Another response"
// etc...
```

Restart bot:
```bash
npm start
```

---

## 📚 Full Documentation

- **Setup Details:** [SETUP.md](./SETUP.md)
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Contributing:** [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)

---

## ⚡ Common Commands

```bash
npm start              # Run bot locally
npm install            # Install dependencies
npm update             # Update dependencies
rm -rf auth_info/      # Reset WhatsApp session
railway logs           # View logs on Railway
git push origin main   # Push code to GitHub
railway up             # Deploy to Railway
```

---

## ⚠️ Important!

- **NEVER commit `auth_info/`** to GitHub
- Keep `.env` file private
- Back up auth_info/ folder safely
- Check `.gitignore` before pushing

---

## 🆘 Issues?

1. Delete auth_info folder and rescan QR code
2. Check `.env` file exists
3. Restart terminal and try again
4. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📞 Help

- 📧 Email: contact@maasterg.org
- 🌐 Website: www.maasterg.org
- 🐛 GitHub Issues: [Create Issue](https://github.com/yourusername/maasterg-bot/issues)

---

**Ready?** Start with: `npm start`

🙏 Made for MAAsterG Community
