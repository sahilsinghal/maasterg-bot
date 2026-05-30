# Deployment Guide - MAAsterG Bot on Railway

Deploy your bot to Railway in 10 minutes. **Completely FREE.**

---

## Why Railway?

✅ **Free Tier:** 600 hours/month (enough for 24/7 operation)  
✅ **Easy Deployment:** One command (`railway up`)  
✅ **Auto-Scaling:** Handles traffic automatically  
✅ **99% Uptime:** Reliable infrastructure  
✅ **Built-in Monitoring:** View logs easily  

---

## Prerequisites

Before deploying, ensure:

- ✅ Bot works locally (`npm start` runs without errors)
- ✅ GitHub account created (free at github.com)
- ✅ Code pushed to GitHub repository
- ✅ `auth_info/` is in `.gitignore`
- ✅ Railway account created (free at railway.app)

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

**Expected output:**
```
Enumerating objects: 8, done.
Counting objects: 100% (8/8), done.
Delta compression using up to 8 threads
Compressing objects: 100% (6/6), done.
Writing objects: 100% (8/8), 2.34 KiB | 2.34 MiB/s, done.
Total 8 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/yourusername/maasterg-bot.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from origin.
```

### 1.3 Verify on GitHub

1. Go to your GitHub repository
2. Check that all files are pushed (bot.js, package.json, etc.)
3. Ensure `auth_info/` is NOT in the repository

---

## Step 2: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start Project"** or **"Log In"** if already registered
3. **Sign up with GitHub** (recommended) or email
4. Grant Railway permission to access your GitHub account
5. Verify email if needed

---

## Step 3: Deploy on Railway

### 3.1 Install Railway CLI

```bash
# Option 1: Using npm
npm install -g @railway/cli

# Option 2: Using Homebrew (macOS)
brew install railway

# Verify installation
railway --version  # Should show version number
```

### 3.2 Login to Railway

```bash
railway login
```

This opens your browser for authentication. Follow the on-screen instructions.

**Expected output:**
```
Opening browser to https://railway.app/cli-login?token=...

✅ You are logged in!
```

### 3.3 Create Railway Project

Navigate to your bot folder and run:

```bash
railway init
```

**Follow prompts:**
```
? Create a new project or use an existing one?
→ Create a new project

? Enter project name:
→ maasterg-bot

? Which template would you like to use?
→ (scroll and select Node.js or skip for generic)
```

### 3.4 Deploy

```bash
railway up
```

**What happens:**
- Railway detects Node.js project
- Installs dependencies (`npm install`)
- Builds the project
- Deploys to Railway servers
- Assigns a public URL (optional)

**Expected output:**
```
Uploading...
Building...
Deploying...
✅ Deployment complete!
View your deployment: https://railway.app/project/...
```

### 3.5 Monitor Deployment

```bash
# View live logs
railway logs

# Follow logs (real-time)
railway logs --follow
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

When bot first runs on Railway:

1. **View logs:**
   ```bash
   railway logs
   ```

2. **Find QR code:** Look for the ASCII QR code in logs

3. **Scan QR code:** Use WhatsApp on your phone
   - Settings → Linked Devices → Link Device
   - Scan the QR code shown in logs

4. **Wait for confirmation:** Terminal shows "BOT CONNECTED & READY"

---

## Deployment Complete! 🎉

Your bot is now running 24/7 on Railway!

### ✅ Success Indicators

- Bot shows "✅ BOT CONNECTED & READY!" in logs
- No error messages appearing
- Bot responds to WhatsApp messages
- Logs show incoming messages

---

## Post-Deployment Checklist

- [ ] Bot deployed successfully
- [ ] Logs show "BOT CONNECTED & READY"
- [ ] QR code scanned successfully
- [ ] Tested bot with test message
- [ ] Menu options working correctly
- [ ] Bot available 24/7

---

## Monitoring & Maintenance

### Daily Monitoring

```bash
# Check bot status
railway logs

# Look for errors or disconnections
# Should see new messages as they arrive
```

### Common Log Messages

| Message | Meaning |
|---------|---------|
| ✅ BOT CONNECTED & READY | Bot is online |
| 📨 From: +91... | New message received |
| ✅ Sent response | Bot sent reply |
| 🔄 Connection lost | Auto-reconnecting (wait 30s) |
| ❌ Error | Something went wrong (check message) |

### View Deployment Details

```bash
# Check project status
railway status

# View environment variables
railway variables

# Check service info
railway service
```

---

## Update Bot Code

After making changes locally:

```bash
# 1. Test changes locally
npm start

# 2. Commit changes
git add .
git commit -m "Updated menu responses"

# 3. Push to GitHub
git push origin main

# 4. Redeploy on Railway
railway up

# 5. Monitor new deployment
railway logs --follow
```

---

## Troubleshooting Deployment

### Issue: "Deployment Failed"

**Solution:**
```bash
# Check logs for errors
railway logs

# Common causes:
# 1. Missing dependencies in package.json
# 2. Node.js version mismatch
# 3. Syntax errors in bot.js

# Fix and redeploy
git push origin main
railway up
```

### Issue: "Bot Disconnects Frequently"

**Solution:**
```bash
# Check internet connection in logs
railway logs

# This usually means WhatsApp server issues
# Often resolves automatically within 24 hours

# Restart deployment
railway up
```

### Issue: "QR Code Not Scanning"

**Solution:**
```bash
# Delete session and rescan
# SSH into Railway (via web dashboard) and run:
rm -rf auth_info/

# Redeploy
railway up

# Scan new QR code in logs
```

### Issue: "Bot Runs Out of Hours"

Railway gives 600 hours/month free. If exceeded:

**Solution:**
- Option 1: Upgrade to paid plan ($5/month for unlimited)
- Option 2: Migrate to Render, Vercel, or other platforms
- Option 3: Wait until next month for hours to reset

---

## Cost Analysis

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Compute | 600 hrs/month | Unlimited |
| Pricing | $0 | $5/month+ |
| Bandwidth | Unlimited | Unlimited |
| Storage | 10GB | 100GB |
| Support | Community | Priority |

**For NGO: Use Free Tier indefinitely!**

---

## Advanced Configuration

### Set Environment Variables

```bash
# Add environment variable
railway variables set PORT 3000

# Add more variables
railway variables set NODE_ENV production

# View all variables
railway variables

# Remove variable
railway variables unset VARIABLE_NAME
```

### Custom Domain (Optional)

1. Go to Railway dashboard
2. Select your project
3. Click "Settings"
4. Add custom domain
5. Update DNS records at your domain provider

### Database Integration (Optional)

Railway supports databases:
- PostgreSQL
- MongoDB
- MySQL
- Redis

To add database:
```bash
# In Railway dashboard:
# New → Database → Choose type
# Railway auto-configures connection string
```

---

## Backup & Disaster Recovery

### Backup Bot Code

```bash
# Code is already backed up on GitHub
# Nothing to do!
```

### Backup WhatsApp Session

The `auth_info/` folder is critical:

```bash
# Local: Keep it safe (never commit to GitHub)
# Cloud: Backup to encrypted cloud storage

# To restore after disaster:
# 1. Copy auth_info/ to new bot folder
# 2. Deploy to Railway
# 3. Bot continues with same WhatsApp session
```

### Restore Bot After Failure

```bash
# If deployment breaks:
railway logs  # Check error

# Fix locally:
git pull origin main
npm install
npm start  # Test locally

# Then redeploy:
git push origin main
railway up
```

---

## Performance Tips

### Optimize Memory

```bash
# Monitor memory usage
railway logs

# Restart bot monthly to clear memory:
# Via Railway dashboard: Restart Deployment
```

### Improve Response Time

- Responses are instant (usually <500ms)
- If slow, check WhatsApp rate limits
- Consider adding caching for common queries

### Scale for Growth

- Free tier handles 1000+ users
- If more, upgrade to paid plan
- Railway auto-scales as needed

---

## Security on Railway

### Keep Credentials Safe

```bash
# auth_info/ is NOT in railway git
# It's only created when bot runs first time
# Each Railway deployment gets fresh session
```

### Monitor Access

```bash
# View who has access to project
railway team

# In Railway dashboard:
# Settings → Sharing → Manage team members
```

### Rotate Sessions

```bash
# Delete session monthly (optional)
# Forces re-authentication
rm -rf auth_info/
railway up
```

---

## SSH Access to Deployment

If you need terminal access:

1. Go to Railway dashboard
2. Select your project
3. Click "Shell" button
4. Run commands directly in Railway environment

```bash
# Example: Check files in Railway
ls -la

# Check system info
uname -a

# View env variables
env | grep RAILWAY
```

---

## FAQ

**Q: Will my bot run 24/7?**
A: Yes! Railway runs continuously. You get 600 hours/month free (24/7 = ~720 hours).

**Q: What if Railway goes down?**
A: Railway has 99% uptime SLA. Very rare. They notify via email if issues.

**Q: Can I move to another hosting later?**
A: Yes! Code is portable. Just clone locally and deploy to Render, Vercel, etc.

**Q: How do I see who is using the bot?**
A: Check logs for incoming messages. Track in database if configured.

**Q: Can I add more team members to manage bot?**
A: Yes! Go to Railway dashboard → Settings → Sharing → Add team members

---

## Next Steps

1. ✅ **Bot is deployed!** Keep running 24/7
2. 📊 **Monitor regularly** - `railway logs --follow`
3. 🔄 **Update code** - Push to GitHub, redeploy with `railway up`
4. 📈 **Scale when needed** - Upgrade plan if required
5. 🎯 **Customize responses** - Add your own menu items

---

## Support

**Having issues?**

- 📖 Check logs: `railway logs`
- 🐛 [GitHub Issues](https://github.com/yourusername/maasterg-bot/issues)
- 💬 [Railway Discord Community](https://discord.gg/railway)
- 📧 Email: contact@maasterg.org

---

## Summary

| Step | Time |
|------|------|
| Push to GitHub | 2 min |
| Create Railway account | 2 min |
| Deploy bot | 3 min |
| Scan QR code | 2 min |
| **Total** | **~10 min** |

**🎉 Your bot is now live on Railway for FREE!**

---

**Need help?** See [SETUP.md](./SETUP.md) or email contact@maasterg.org
