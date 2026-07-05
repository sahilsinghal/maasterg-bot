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

## 6️⃣ Deploy to Oracle Cloud (Optional)

Deploy on an Oracle Cloud "Always Free" Ubuntu VM (no monthly hour limit). Full walkthrough in [DEPLOYMENT.md](./DEPLOYMENT.md).

```bash
# SSH into your Always Free VM
ssh -i /path/to/key ubuntu@<your-public-ip>

# On the VM: install pm2, clone the repo, install deps
sudo npm install -g pm2
git clone https://github.com/yourusername/maasterg-bot.git
cd maasterg-bot && npm install

# Start the bot with pm2
pm2 start bot.js --name maasterg-bot

# Keep it running across reboots
pm2 startup
pm2 save

# View logs
pm2 logs maasterg-bot
```

Then open `http://<your-public-ip>:3000/qr` in a browser to scan the QR code.

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
pm2 logs maasterg-bot  # View logs on Oracle Cloud VM
git push origin main   # Push code to GitHub
pm2 restart maasterg-bot  # Restart bot after an update
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
