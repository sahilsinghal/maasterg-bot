# Deployment Guide - MAAsterG Bot on Oracle Cloud

Deploy your bot to an Oracle Cloud **Always Free** VM. **Completely FREE, forever — no monthly hour limits.**

---

## Why Oracle Cloud?

✅ **Always Free:** A VM that runs 24/7 with no monthly hour cap (unlike time-limited free tiers)
✅ **Full Control:** A real Ubuntu server you SSH into — install anything
✅ **Persistent:** Your `auth_info/` session survives restarts, so you scan the QR only once
✅ **Reliable:** Backed by Oracle Cloud Infrastructure (OCI)
✅ **pm2 Process Manager:** Auto-restart on crash and on server reboot

---

## Prerequisites

Before deploying, ensure:

- ✅ Bot works locally (`npm start` runs without errors)
- ✅ GitHub account created (free at github.com)
- ✅ Code pushed to GitHub repository
- ✅ `auth_info/` is in `.gitignore`
- ✅ Oracle Cloud account created (free at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/))

---

## Step 1: Prepare GitHub Repository

### 1.1 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `maasterg-bot`
3. **Description:** MAAsterG WhatsApp Bot
4. **Visibility:** Public or Private (your choice)
5. Click **Create repository**

### 1.2 Push Code to GitHub

```bash
# Configure Git (one-time)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Navigate to bot folder
cd maasterg-bot

# Initialize and configure
git init
git add .
git commit -m "Initial MAAsterG bot setup"
git branch -M main

# Add remote and push
git remote add origin https://github.com/yourusername/maasterg-bot.git
git push -u origin main
```

### 1.3 Verify on GitHub

1. Go to your GitHub repository
2. Check that all files are pushed (bot.js, package.json, etc.)
3. Ensure `auth_info/` is NOT in the repository

---

## Step 2: Create the Oracle Cloud VM

1. Sign up / log in at [cloud.oracle.com](https://cloud.oracle.com)
2. Go to **Compute → Instances → Create Instance**
3. **Image:** Canonical Ubuntu 22.04
4. **Shape:** Pick an **Always Free eligible** shape:
   - `VM.Standard.A1.Flex` (Arm — 4 vCPU / 24 GB is the generous free option), or
   - `VM.Standard.E2.1.Micro` (AMD — always free)
5. **SSH keys:** Upload your public key (or let OCI generate a keypair and download the private key)
6. Click **Create** and wait for the instance to reach **Running**
7. Note the **Public IP address** shown on the instance page

### 2.1 Open the QR web port (3000)

The bot serves a scannable QR page on port `3000`. Allow it in two places:

**a) OCI Security List / Network Security Group**
- Networking → Virtual Cloud Network → your VCN → Security Lists → Default
- Add an **Ingress Rule**: Source `0.0.0.0/0`, IP Protocol `TCP`, Destination Port `3000`

**b) Ubuntu firewall (on the VM, after you SSH in — see Step 3)**
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

> 💡 You only need port 3000 open long enough to scan the QR the first time. You can close it again afterward.

---

## Step 3: Deploy on the VM

### 3.1 SSH into the server

```bash
ssh -i /path/to/your-private-key ubuntu@<your-public-ip>
```

### 3.2 Install Node.js and pm2

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Verify
node --version   # should be v18+
npm --version

# Install pm2 process manager (keeps the bot alive)
sudo npm install -g pm2
```

### 3.3 Clone and install the bot

```bash
cd ~
git clone https://github.com/yourusername/maasterg-bot.git
cd maasterg-bot
npm install
```

### 3.4 Start the bot with pm2

```bash
pm2 start bot.js --name maasterg-bot

# Make pm2 restart the bot automatically on server reboot
pm2 startup
# ^ copy–paste and run the command it prints, then:
pm2 save
```

### 3.5 Monitor

```bash
# Live logs
pm2 logs maasterg-bot

# Status
pm2 status
```

**Expected logs:**
```
╔════════════════════════════════════════╗
║     🙏 MAAsterG WhatsApp Bot 🙏       ║
║           Starting...                 ║
╚════════════════════════════════════════╝

✅ BOT CONNECTED & READY! ✅

🤖 MAAsterG Bot is now LIVE
📊 Waiting for incoming messages...
```

---

## Step 4: QR Code Scanning (First Time Only)

The terminal QR is often mangled in server logs, so use the **web QR page**:

1. In a browser, open: `http://<your-public-ip>:3000/qr`
2. On your phone: WhatsApp → **Settings → Linked Devices → Link a Device**
3. Scan the QR shown on the page (it refreshes automatically)
4. Wait for the logs to show **"✅ BOT CONNECTED & READY!"**

The session is saved to `auth_info/` on the VM, so you won't need to scan again unless you delete it or WhatsApp unlinks the device.

---

## Deployment Complete! 🎉

Your bot is now running 24/7 on Oracle Cloud!

### ✅ Success Indicators

- `pm2 status` shows `maasterg-bot` as **online**
- Logs show "✅ BOT CONNECTED & READY!"
- Bot responds to WhatsApp messages

---

## Post-Deployment Checklist

- [ ] VM created and running
- [ ] Port 3000 opened (OCI security list + Ubuntu iptables)
- [ ] Node.js + pm2 installed
- [ ] Bot started with pm2 and `pm2 save` run
- [ ] QR scanned via `/qr` page → "BOT CONNECTED & READY"
- [ ] Tested bot with a real WhatsApp message
- [ ] `pm2 startup` configured for reboot persistence

---

## Monitoring & Maintenance

### Daily Monitoring

```bash
pm2 status              # is it online?
pm2 logs maasterg-bot   # live logs
```

### Common Log Messages

| Message | Meaning |
|---------|---------|
| ✅ BOT CONNECTED & READY | Bot is online |
| 📨 From: ...@lid / ...@s.whatsapp.net | New message received |
| ✅ Sent response | Bot sent reply |
| 🔄 Connection lost | Auto-reconnecting (wait a few seconds) |
| Bad MAC / Failed to decrypt | Harmless Signal session noise — WhatsApp auto-recovers |
| ❌ Error | Something went wrong (check message) |

---

## Update Bot Code

After making changes locally and pushing to GitHub:

```bash
# On the VM
cd ~/maasterg-bot
git pull origin main
npm install            # only if dependencies changed
pm2 restart maasterg-bot
pm2 logs maasterg-bot  # confirm it came back up
```

---

## Troubleshooting Deployment

### Issue: "Can't open the /qr page in the browser"

**Solution:**
- Confirm the ingress rule for TCP 3000 exists in the OCI Security List
- Confirm the Ubuntu firewall allows 3000 (`sudo iptables -L -n | grep 3000`)
- Confirm the bot is running: `pm2 status`

### Issue: "Bot Disconnects Frequently"

**Solution:**
```bash
pm2 logs maasterg-bot
# Usually transient WhatsApp server issues; pm2 + the built-in
# reconnect handler recover automatically.
pm2 restart maasterg-bot   # if it stays stuck
```

### Issue: "QR Code Not Scanning / session broken"

**Solution:**
```bash
cd ~/maasterg-bot
rm -rf auth_info
pm2 restart maasterg-bot
# Reopen http://<your-public-ip>:3000/qr and scan the fresh QR
```

### Issue: "pm2 not running after reboot"

**Solution:**
```bash
pm2 startup     # run the printed command
pm2 save        # snapshot current process list
```

---

## Cost

Oracle Cloud's **Always Free** tier includes eligible compute shapes that run continuously at **$0/month with no hour cap**. This is the main reason for moving here from time-limited free hosts — there is no monthly runtime limit to exhaust.

> ⚠️ Keep the instance on an **Always Free eligible shape** so it is never billed. Check Oracle's current Always Free limits when creating the VM.

---

## Backup & Disaster Recovery

### Backup Bot Code

Your code lives on GitHub — nothing to do beyond keeping it pushed.

### Backup WhatsApp Session

The `auth_info/` folder on the VM holds your WhatsApp session:

```bash
# Download a backup from the VM to your machine
scp -i /path/to/key -r ubuntu@<public-ip>:~/maasterg-bot/auth_info ./auth_info-backup
```

To restore: copy `auth_info/` back into `~/maasterg-bot` on a fresh VM, then `pm2 start bot.js --name maasterg-bot`. The bot continues with the same WhatsApp session (no re-scan).

---

## Advanced Configuration

### Environment Variables

The bot reads `PORT` (defaults to 3000). To change it with pm2:

```bash
PORT=8080 pm2 restart maasterg-bot --update-env
```

### Custom Domain / HTTPS (Optional)

Put an Nginx reverse proxy in front and use a free Let's Encrypt certificate if you want a domain instead of the raw IP.

---

## FAQ

**Q: Will my bot run 24/7?**
A: Yes. pm2 keeps it alive, `pm2 startup` restarts it on reboot, and the Always Free VM has no monthly hour limit.

**Q: Do I have to scan the QR every restart?**
A: No. The session is stored in `auth_info/` on the VM and reused across restarts.

**Q: Can I move to another host later?**
A: Yes — the code is portable. Copy `auth_info/` along with it to keep the same session.

**Q: How do I see who is using the bot?**
A: Check `pm2 logs maasterg-bot` for incoming messages, or wire up a database.

---

## Next Steps

1. ✅ **Bot is deployed!** Running 24/7 via pm2
2. 📊 **Monitor** — `pm2 logs maasterg-bot`
3. 🔄 **Update code** — `git pull` + `pm2 restart maasterg-bot`
4. 🎯 **Customize responses** — edit `menuData` in `bot.js`

---

## Support

**Having issues?**

- 📖 Check logs: `pm2 logs maasterg-bot`
- 🐛 [GitHub Issues](https://github.com/yourusername/maasterg-bot/issues)
- 🐛 [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- 📧 Email: contact@maasterg.org

---

## Summary

| Step | Time |
|------|------|
| Push to GitHub | 2 min |
| Create Oracle Cloud VM | 5 min |
| Open port 3000 | 2 min |
| Install Node + pm2, clone, start | 5 min |
| Scan QR via /qr page | 2 min |
| **Total** | **~15 min** |

**🎉 Your bot is now live on Oracle Cloud for FREE — 24/7, no hour limits!**

---

**Need help?** See [SETUP.md](./SETUP.md) or email contact@maasterg.org
