# Troubleshooting Guide - MAAsterG Bot

Quick solutions to common problems.

---

## Local Setup Issues

### ❌ "command not found: node"

**Cause:** Node.js not installed or PATH not updated

**Solutions:**

```bash
# Verify Node.js installation
node --version

# If not found:
# 1. Visit nodejs.org and install latest LTS
# 2. Restart terminal after installation
# 3. Try again: node --version
```

### ❌ "command not found: npm"

**Cause:** npm not installed with Node.js

**Solutions:**

```bash
# Check if npm installed
npm --version

# If not found:
# 1. Reinstall Node.js (npm comes with it)
# 2. On macOS: brew install node
# 3. On Linux: sudo apt-get install nodejs npm
```

### ❌ "Cannot find module '@whiskeysockets/baileys'"

**Cause:** Dependencies not installed

**Solutions:**

```bash
# Reinstall dependencies
npm install

# If still fails, clear cache
npm cache clean --force

# Reinstall
npm install

# Check package.json is not corrupted
cat package.json | grep baileys
```

### ❌ "EACCES: permission denied"

**Cause:** Permission issue on Linux/macOS

**Solutions:**

```bash
# Option 1: Use sudo (not recommended)
sudo npm install

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 3: Fix directory ownership
sudo chown -R $(whoami) ~/.npm
```

### ❌ "Port 3000 already in use"

**Cause:** Another application using port 3000

**Solutions:**

```bash
# Option 1: Change port in .env
# Edit .env and change:
PORT=3001  # or any other free port

# Option 2: Find and kill process using port 3000
# macOS/Linux:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## QR Code Issues

### ❌ "QR code not appearing in terminal"

**Cause:** Terminal output redirected or buffering issue

**Solutions:**

```bash
# Option 1: Force unbuffered output
node bot.js 2>&1

# Option 2: Use stdbuf (Linux)
stdbuf -oL node bot.js

# Option 3: Run with explicit logging
DEBUG=* npm start

# Option 4: Disable logger buffering
node --no-deprecation bot.js
```

### ❌ "Failed to scan QR code"

**Cause:** QR code expired or scanning error

**Solutions:**

```bash
# QR codes expire in 5 minutes
# Stop bot and start again
npm start

# Ensure:
# 1. Phone has good internet
# 2. Camera not blocked
# 3. Enough light to scan
# 4. Phone is updated to latest WhatsApp
```

### ❌ "Your WhatsApp account seems unusual"

**Cause:** WhatsApp security alert

**Solutions:**

```bash
# 1. Open WhatsApp on your phone
# 2. Verify your account (if prompted)
# 3. Delete auth_info/ folder
rm -rf auth_info/

# 4. Restart bot and rescan QR code
npm start

# 5. Wait 24 hours if account is temporarily locked
```

---

## Connection Issues

### ❌ "Bot disconnects frequently"

**Cause:** Network issues or WhatsApp rate limiting

**Solutions:**

```bash
# Option 1: Restart with fresh session
rm -rf auth_info/
npm start

# Option 2: Check internet connection
ping google.com

# Option 3: Increase reconnection timeout
# Edit bot.js, find:
# setTimeout(() => connectToWhatsApp(), 3000)
# Change to: 5000 (5 seconds)

# Option 4: Run on stable network
# Avoid WiFi, use ethernet if possible
```

### ❌ "Cannot connect to WhatsApp servers"

**Cause:** Firewall or internet issue

**Solutions:**

```bash
# Check internet
ping -c 4 8.8.8.8

# Check WhatsApp connectivity
telnet web.whatsapp.com 443

# Disable firewall temporarily (test only)
# macOS: System Preferences → Security & Privacy → Firewall off
# Windows: Settings → Firewall & Network Protection off

# Use VPN if WhatsApp blocked in your country
```

### ❌ "Bot connected but not receiving messages"

**Cause:** WhatsApp session issue or rate limiting

**Solutions:**

```bash
# Option 1: Rescan QR code
rm -rf auth_info/
npm start

# Option 2: Wait and retry
# WhatsApp may rate limit - wait 1 hour

# Option 3: Check logs for errors
npm start 2>&1 | grep -i error

# Option 4: Update libraries
npm update
npm start
```

---

## Message Issues

### ❌ "Sending messages very slowly"

**Cause:** WhatsApp rate limiting or network latency

**Solutions:**

```bash
# Check network latency
ping 1.1.1.1

# If high latency (>500ms), check internet

# Add delays between sends (in bot.js):
await new Promise(resolve => setTimeout(resolve, 1000))
await sock.sendMessage(sender, { text: response })

# Restart bot
npm start
```

### ❌ "Some messages not being received"

**Cause:** WhatsApp filtering or rate limiting

**Solutions:**

```bash
# Option 1: Check message format
# Ensure no special characters causing issues

# Option 2: Resend manually
# Send message again after 5 minutes

# Option 3: Check WhatsApp logs
npm start 2>&1 | grep -i received

# Option 4: Increase polling interval
# Edit bot.js and find polling settings
```

---

## Menu/Functionality Issues

### ❌ "Menu not appearing"

**Cause:** Language selection issue

**Solutions:**

```bash
# Check bot is running
npm start

# Send any message
# If menu not appearing, check logs for errors

# Try resetting session
rm -rf auth_info/
npm start
```

### ❌ "Invalid response to menu option"

**Cause:** Typo in menu responses

**Solutions:**

```bash
# Check bot.js menuData object
grep -n "responses:" bot.js

# Look for syntax errors
node -c bot.js  # Check syntax

# View specific response
cat bot.js | grep -A 5 "1: {"

# Fix error and restart
npm start
```

### ❌ "Responses too long (message limit)"

**Cause:** WhatsApp message character limit

**Solutions:**

```bash
# Split long messages in bot.js
# Instead of one long message:
await sock.sendMessage(sender, { text: longMessage })

# Send as multiple messages:
await sock.sendMessage(sender, { text: part1 })
await new Promise(resolve => setTimeout(resolve, 500))
await sock.sendMessage(sender, { text: part2 })
```

---

## Oracle Cloud Deployment Issues

### ❌ "Deployment failed"

**Cause:** Various - check logs

**Solutions:**

```bash
# View error logs on the VM
pm2 logs maasterg-bot

# Common causes:
# 1. Syntax error in bot.js
# 2. Missing dependency in package.json
# 3. Node.js version mismatch

# Fix locally first
npm start

# Then deploy the update on the VM
cd ~/maasterg-bot && git pull origin main && npm install && pm2 restart maasterg-bot
```

### ❌ "Bot not connecting after deployment"

**Cause:** Fresh WhatsApp session needed on the VM

**Solutions:**

```bash
# View logs
pm2 logs maasterg-bot

# Open the QR page in a browser and scan it:
# http://<your-public-ip>:3000/qr
# (Requires TCP port 3000 open in the OCI Security List
#  ingress rules AND the Ubuntu iptables firewall)

# If no QR appears, restart the bot:
pm2 restart maasterg-bot

# Monitor logs
pm2 logs maasterg-bot
```

### ❌ "Worried about running out of free hours"

**Cause:** Misconception carried over from hour-capped platforms

**Solutions:**

```bash
# Good news: the Oracle Cloud Always Free tier has NO monthly
# hour cap — the VM can run 24/7 at $0/month.

# The only thing to check: make sure the instance uses an
# Always-Free-eligible shape (e.g. VM.Standard.A1.Flex within
# the free allocation, or VM.Standard.E2.1.Micro) so it is
# never billed. Confirm in the OCI console under Compute.
```

### ❌ "High memory usage on the VM"

**Cause:** Memory leak or large session

**Solutions:**

```bash
# Monitor memory
pm2 status
pm2 logs maasterg-bot | grep -i memory

# Restart the bot (clears memory)
pm2 restart maasterg-bot

# Optimize code to reduce memory footprint
```

---

## GitHub Issues

### ❌ "Cannot push to GitHub"

**Cause:** Authentication or permission issue

**Solutions:**

```bash
# Check Git config
git config --list

# Set up SSH (recommended)
ssh-keygen -t ed25519
cat ~/.ssh/id_ed25519.pub  # Copy this

# Add to GitHub:
# Settings → SSH and GPG keys → New SSH key → Paste

# Or use HTTPS with token:
# GitHub → Settings → Developer settings → Personal access tokens
# Create token and use as password when pushing
```

### ❌ "auth_info/ accidentally pushed to GitHub"

**Cause:** .gitignore not set up correctly

**Solutions:**

```bash
# Remove from Git history (URGENT!)
git rm --cached -r auth_info/
git commit -m "Remove auth_info from git history"
git push origin main

# Regenerate new WhatsApp session
rm -rf auth_info/
npm start

# UPDATE PASSWORD on WhatsApp account (security measure)
```

### ❌ "Cannot clone repository"

**Cause:** Access denied or wrong URL

**Solutions:**

```bash
# Check repo URL
git remote -v

# Re-clone with correct URL
cd /tmp
git clone https://github.com/yourusername/maasterg-bot.git

# If permission denied with SSH:
git clone git@github.com:yourusername/maasterg-bot.git
```

---

## Performance Issues

### ❌ "Bot running slowly"

**Cause:** High CPU/Memory or network latency

**Solutions:**

```bash
# Check resources
ps aux | grep node

# Monitor in real-time
top -p $(pgrep -f "node bot.js")

# Restart bot (clears memory)
npm start

# Check network
ping google.com

# Run on better hardware if possible
```

### ❌ "Responding to messages after long delay"

**Cause:** WhatsApp throttling or server load

**Solutions:**

```bash
# Check latency
time ping web.whatsapp.com

# Monitor logs for delays
npm start 2>&1 | tee logs.txt

# Contact WhatsApp support if persistent
# Meanwhile, inform users about delays
```

---

## Advanced Debugging

### Enable Verbose Logging

```bash
# View all debug messages
DEBUG=* npm start

# View only specific module
DEBUG=baileys npm start

# Save logs to file
npm start > bot.log 2>&1 &
tail -f bot.log
```

### Check Node.js Resources

```bash
# Memory usage
node -e "console.log(require('os').totalmem() / 1024 / 1024)"

# Check event listeners
node -e "console.log(process.eventNames())"

# Monitor GC
node --trace-gc bot.js 2>&1 | grep GC
```

### Network Debugging

```bash
# Check DNS resolution
nslookup web.whatsapp.com

# Check network routes
traceroute web.whatsapp.com

# Monitor network traffic
tcpdump -i any port 443 | grep whatsapp
```

---

## Prevention & Best Practices

### 1. Regular Monitoring

```bash
# Check bot daily
pm2 logs maasterg-bot

# Set up alerts (optional)
# Log sensitive errors to file
npm start 2>&1 | tee bot.log
```

### 2. Regular Backups

```bash
# Backup code to GitHub (automatic)
git push origin main

# Backup auth_info (monthly)
# To encrypted cloud storage or USB drive
tar -czf auth_info_backup.tar.gz auth_info/
gpg --encrypt auth_info_backup.tar.gz
```

### 3. Update Dependencies

```bash
# Check for updates monthly
npm outdated

# Update safely
npm update

# Test locally before deploying
npm start

# Push updates, then deploy on the VM
git push origin main
# On the VM:
cd ~/maasterg-bot && git pull origin main && npm install && pm2 restart maasterg-bot
```

### 4. Monitor WhatsApp Warnings

- Watch for "Your WhatsApp account seems unusual"
- Verify account immediately if prompted
- Avoid sending bulk/spam messages
- Keep bot in personal use mode

---

## Getting Help

If still stuck:

1. **Check logs thoroughly:** `npm start 2>&1 | head -100`
2. **Search GitHub issues:** Similar problem might be documented
3. **Search Stack Overflow:** Tag `baileys-whatsapp`
4. **Contact support:**
   - Email: contact@maasterg.org
   - GitHub Issues: yourusername/maasterg-bot

**Include when reporting:**

```
- Operating system: [Windows/Mac/Linux]
- Node.js version: [output of `node --version`]
- Error message: [exact error text]
- Steps to reproduce: [what you did before error]
- Bot logs: [relevant log lines]
```

---

## Quick Checklist

Before declaring problem fixed:

- [ ] Tested locally (`npm start` works)
- [ ] Sent test message
- [ ] Menu options respond
- [ ] No errors in logs
- [ ] Bot stable for 5+ minutes
- [ ] Code pushed to GitHub
- [ ] pm2 status showing "online" and logs show "connected"

---

## FAQ

**Q: Why does bot keep disconnecting?**
A: Usually network-related. Check internet, restart bot, or rescan QR code.

**Q: How long before WhatsApp unblocks bot?**
A: Usually 24 hours. Avoid bulk messages in future.

**Q: Can I run multiple bots?**
A: Yes, run each as a separate pm2 process (e.g. `pm2 start bot.js --name maasterg-bot-2`), ideally in its own folder with a different port.

**Q: How do I move bot to another server?**
A: Clone code from GitHub, deploy to new host.

**Q: What if I lose auth_info/?**
A: Just rescan QR code. Creates new session.

---

**Still need help?** Email: contact@maasterg.org
