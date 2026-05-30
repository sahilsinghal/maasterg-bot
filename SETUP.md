# Setup Guide - MAAsterG WhatsApp Bot

## Prerequisites

Before you begin, make sure you have:

- **Operating System:** Windows, macOS, or Linux
- **Node.js:** Version 18 LTS or higher
- **npm:** Version 8 or higher (comes with Node.js)
- **Internet:** Stable connection (at least 256 Kbps)
- **WhatsApp:** Active account on your phone
- **Terminal:** Command line interface (Terminal on Mac/Linux, CMD on Windows)

---

## Step-by-Step Installation

### Step 1: Install Node.js

#### Windows & macOS
1. Visit [nodejs.org](https://nodejs.org)
2. Download LTS version (v18 or higher)
3. Run the installer and follow instructions
4. Accept all default settings

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Verify Installation
```bash
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or higher
```

---

### Step 2: Clone the Repository

#### Option A: Using Git
```bash
git clone https://github.com/yourusername/maasterg-bot.git
cd maasterg-bot
```

#### Option B: Download ZIP
1. Go to GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Open terminal in extracted folder

---

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- `@whiskeysockets/baileys` - WhatsApp library
- `qrcode-terminal` - QR code display
- `pino` - Logging
- `express` - Web framework
- `dotenv` - Environment variables

**Expected output:**
```
added 150 packages in 45s
```

---

### Step 4: Create Environment File

```bash
# Copy the example file
cp .env.example .env

# On Windows:
copy .env.example .env
```

Edit `.env` file:
```
PORT=3000
NODE_ENV=production
```

---

### Step 5: Start the Bot

```bash
npm start
```

**Expected output:**
```
╔════════════════════════════════════════╗
║     🙏 MAAsterG WhatsApp Bot 🙏       ║
║           Starting...                 ║
╚════════════════════════════════════════╝

╔════════════════════════════════════════╗
║   📱 SCAN QR CODE WITH WHATSAPP 📱    ║
╚════════════════════════════════════════╝

[QR CODE HERE]

⏳ QR Code expires in 5 minutes

✋ Do NOT close this terminal while scanning!
```

---

### Step 6: Scan QR Code

1. **On your phone:** Open WhatsApp
2. **Go to:** Settings → Linked Devices → Link Device
3. **Scan the QR code** shown in the terminal
4. **Wait for confirmation** in terminal

**Expected output after scanning:**
```
✅ BOT CONNECTED & READY! ✅

🤖 MAAsterG Bot is now LIVE

📊 Waiting for incoming messages...
```

---

### Step 7: Test the Bot

1. **From any WhatsApp contact:** Send a message to your bot number
2. **Expected response:** Language selection menu appears
3. **Select language:** Reply with 1, 2, or 3
4. **Test menu:** Try different options

---

## 🎉 Success Indicators

Your setup is successful when:

✅ Bot starts without errors  
✅ QR code displays in terminal  
✅ QR code scans successfully  
✅ Terminal shows "BOT CONNECTED & READY"  
✅ You can send/receive messages  
✅ Menu options work correctly  

---

## Troubleshooting Local Setup

### Issue: "Node.js not found"
**Solution:**
```bash
# Verify installation
node --version

# If not found, reinstall Node.js from nodejs.org
# Make sure to restart terminal after installation
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Change port in .env file
PORT=3001  # or any other available port

# Restart bot
npm start
```

### Issue: "Cannot find module '@whiskeysockets/baileys'"
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json

# Then reinstall
npm install

# Start bot
npm start
```

### Issue: "QR code not appearing"
**Solution:**
```bash
# Force terminal output
node bot.js 2>&1

# Or try with explicit logging
DEBUG=* npm start
```

### Issue: "WhatsApp Web session expired"
**Solution:**
```bash
# Delete session files and rescan
rm -rf auth_info/

# Start bot again
npm start

# Rescan QR code
```

### Issue: "Messages are not being received"
**Causes:**
- WhatsApp blocked the connection (restart after 1 hour)
- Bot account logged out (rescan QR code)
- Internet connection issues (check connectivity)

**Solution:**
```bash
# Restart bot with fresh session
rm -rf auth_info/
npm start
```

---

## Project Structure

```
maasterg-bot/
├── bot.js                 # Main bot code
├── package.json           # Dependencies
├── .env                   # Configuration (create after cloning)
├── .env.example           # Configuration template
├── .gitignore             # Git ignore rules
├── README.md              # Main documentation
├── SETUP.md               # This file
├── DEPLOYMENT.md          # Railway deployment guide
├── LICENSE                # MIT License
└── auth_info/             # WhatsApp session (auto-created, don't commit!)
    ├── creds.json
    └── other session files...
```

---

## File Descriptions

| File | Purpose |
|------|---------|
| `bot.js` | Complete bot logic, menu handling, message processing |
| `package.json` | Project metadata and dependencies |
| `.env` | Your local environment variables (NEVER commit) |
| `.env.example` | Template for .env file |
| `.gitignore` | Tells Git which files to ignore |
| `auth_info/` | WhatsApp session data (auto-created, keep private) |

---

## Next Steps

After successful local setup:

1. **Customize responses** - Edit menu text in `bot.js`
2. **Add more languages** - Duplicate language section in `menuData`
3. **Deploy to Railway** - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Connect database** - Optional, for data persistence
5. **Set up monitoring** - Track bot performance

---

## Advanced Configuration

### Enable Debug Logging

```bash
# Very verbose output
DEBUG=* npm start

# Normal operation
NODE_DEBUG=* npm start
```

### Run in Background (macOS/Linux)

```bash
# Start in background
nohup npm start > bot.log 2>&1 &

# Check status
ps aux | grep bot

# View logs
tail -f bot.log

# Kill bot
pkill -f "node bot.js"
```

### Run in Background (Windows)

```bash
# Using start command
start node bot.js

# Or use npm with timeout delay to keep window open
npm start
```

---

## Performance Monitoring

### Memory Usage
```bash
# Check memory consumption
ps aux | grep node

# Should be under 200MB for normal operation
```

### CPU Usage
```bash
# Monitor live
top -p $(pgrep -f "node bot.js")
```

### Log Analysis
Check the terminal output for:
- Error messages (red text)
- Warning messages (yellow text)
- Info messages (blue text)
- Success messages (green text)

---

## Security Best Practices

1. **Never Share `auth_info/`**
   - Contains WhatsApp credentials
   - Keep it private and secure

2. **Use Strong Passwords**
   - Protect your GitHub account
   - Enable 2FA on GitHub

3. **Regular Backups**
   - Backup bot code on GitHub
   - Backup `auth_info/` encrypted

4. **Update Dependencies**
   - Check for updates monthly
   - Run `npm outdated` to see available updates

---

## Common Commands Reference

```bash
# Start bot
npm start

# Check Node version
node --version

# Check npm version
npm --version

# Install dependencies
npm install

# List installed packages
npm list

# Check for outdated packages
npm outdated

# Update all packages
npm update

# View bot code
cat bot.js

# Search in bot code
grep -n "MAAsterG" bot.js

# Stop bot (in terminal)
Ctrl + C

# Delete WhatsApp session
rm -rf auth_info/
```

---

## FAQ

**Q: Can I run the bot 24/7 locally?**
A: Yes, but it's better to deploy to Railway for reliability. Keeping your computer on 24/7 wastes electricity.

**Q: Do I need a separate WhatsApp number?**
A: No, you can use your personal number. But for production, use a dedicated business number.

**Q: Can I run multiple instances?**
A: Yes, create multiple folders and use different port numbers in .env

**Q: What if WhatsApp blocks my account?**
A: WhatsApp may temporarily block accounts. Wait 24 hours and try again. Avoid bulk/spam messages.

**Q: How do I backup my bot?**
A: Push code to GitHub and backup `auth_info/` folder separately (encrypted).

---

## Getting Help

If you're stuck:

1. **Check logs** - Look at terminal output for error messages
2. **Restart bot** - Sometimes just restarting helps
3. **Delete session** - `rm -rf auth_info/` and rescan QR code
4. **Check GitHub issues** - Others might have faced same issue
5. **Contact support** - Email contact@maasterg.org

---

## Next: Deployment

Once your bot is working locally, deploy it to Railway!

👉 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for free cloud deployment**

---

**Happy Coding! 🎉**

Questions? Email: contact@maasterg.org
