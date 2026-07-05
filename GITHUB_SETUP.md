# 📤 Push to GitHub - Complete Guide

This repository is ready to push to GitHub. Follow these steps.

---

## Step 1: Create GitHub Account (if you don't have one)

1. Go to [github.com](https://github.com)
2. Click "Sign up"
3. Follow prompts to create account
4. Verify email address

---

## Step 2: Create New Repository on GitHub

1. Log in to [github.com](https://github.com)
2. Click "+" icon (top right) → **New repository**
3. Fill in details:
   - **Repository name:** `maasterg-bot`
   - **Description:** `🙏 MAAsterG WhatsApp Bot - Free, Open-Source, NGO-Friendly`
   - **Public/Private:** Choose public (so others can clone it)
   - **Uncheck** "Add a README file" (we already have one)
4. Click **Create repository**

---

## Step 3: Configure Git (First Time Only)

```bash
# Set your name (global)
git config --global user.name "Your Name"

# Set your email (global)
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

---

## Step 4: Push Repository to GitHub

Navigate to your bot folder and run:

```bash
cd maasterg-bot

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete MAAsterG WhatsApp Bot setup"

# Rename branch to main (if needed)
git branch -M main

# Add GitHub repository URL (replace username)
git remote add origin https://github.com/YOUR_USERNAME/maasterg-bot.git

# Push to GitHub
git push -u origin main
```

**Expected output:**
```
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 8 threads
Compressing objects: 100% (8/8), done.
Writing objects: 100% (15/15), 2.50 KiB | 2.50 MiB/s, done.
Total 15 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/YOUR_USERNAME/maasterg-bot.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from origin.
```

---

## Step 5: Verify on GitHub

1. Go to `https://github.com/YOUR_USERNAME/maasterg-bot`
2. Verify all files are there:
   - ✅ bot.js
   - ✅ package.json
   - ✅ README.md
   - ✅ SETUP.md
   - ✅ DEPLOYMENT.md
   - ✅ QUICKSTART.md
   - ✅ TROUBLESHOOTING.md
   - ✅ LICENSE
   - ✅ .gitignore
   - ✅ .github/CONTRIBUTING.md
3. Check that `auth_info/` is NOT present (good!)

---

## Using SSH (Advanced but More Secure)

### Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# When prompted:
# Enter file: press Enter (default)
# Enter passphrase: create strong passphrase (or press Enter)
# Confirm passphrase: repeat

# View your public key
cat ~/.ssh/id_ed25519.pub
```

### Add SSH Key to GitHub

1. Go to GitHub: **Settings → SSH and GPG keys**
2. Click **New SSH key**
3. Paste your public key (from above)
4. Click **Add SSH key**

### Use SSH for Push

```bash
# Instead of HTTPS, use SSH
git remote remove origin
git remote add origin git@github.com:YOUR_USERNAME/maasterg-bot.git
git push -u origin main
```

---

## Future Updates

After making changes locally:

```bash
# See what changed
git status

# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: Add new feature description"

# Push to GitHub
git push origin main
```

---

## Useful Git Commands

```bash
# Check repository status
git status

# View commit history
git log --oneline

# View remote URL
git remote -v

# Create new branch
git checkout -b feature-name

# Switch branch
git checkout main

# Merge branch to main
git merge feature-name

# View all branches
git branch -a

# Delete branch
git branch -d branch-name

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View specific file changes
git diff bot.js
```

---

## Troubleshooting Git

### ❌ "Permission denied (publickey)"

**Solution:**
```bash
# Use HTTPS instead of SSH
git remote set-url origin https://github.com/YOUR_USERNAME/maasterg-bot.git

# Or set up SSH key properly (see above)
```

### ❌ "fatal: 'origin' does not appear to be a 'git' repository"

**Solution:**
```bash
# Check if in git repository
ls -la .git

# If not, initialize
git init
```

### ❌ "failed to push some refs"

**Solution:**
```bash
# Pull latest changes first
git pull origin main

# Then push
git push origin main
```

### ❌ "Please tell me who you are"

**Solution:**
```bash
# Set Git config
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Setting Up GitHub for Team

### Add Collaborators

1. Go to repository settings
2. Click **Collaborators**
3. Enter GitHub username of person to add
4. They'll receive invitation

### Protect Main Branch (Optional)

1. Go to repository settings
2. Click **Branches**
3. Click **Add rule**
4. Set branch name to `main`
5. Enable "Require pull request reviews"
6. Save changes

---

## GitHub Features to Enable

### 1. README Badge

Add to README.md:
```markdown
![GitHub License](https://img.shields.io/github/license/YOUR_USERNAME/maasterg-bot)
![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/maasterg-bot)
![GitHub Issues](https://img.shields.io/github/issues/YOUR_USERNAME/maasterg-bot)
```

### 2. GitHub Pages (Optional)

Deploy documentation:
1. Settings → Pages
2. Select main branch
3. Save
4. Your docs available at: `https://YOUR_USERNAME.github.io/maasterg-bot`

### 3. GitHub Actions (CI/CD)

Create `.github/workflows/test.yml` for automated tests.

### 4. Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md` for bug reports.

---

## Public Repository Benefits

- ✅ Anyone can clone your bot
- ✅ Easy to share with team
- ✅ Open source collaboration
- ✅ Track changes in Git history
- ✅ Deploy from GitHub (to your Oracle Cloud VM via `git pull`)

---

## Private Repository Benefits

- ✅ Only authorized people can access
- ✅ Better for sensitive modifications
- ✅ Can add specific team members

You can change visibility anytime in repository settings.

---

## Next Steps After Pushing

1. **Share repository URL:** Send to team/community
2. **Deploy to Oracle Cloud** (see [DEPLOYMENT.md](./DEPLOYMENT.md) for full steps):
   ```bash
   # SSH into your Always Free VM, then:
   sudo npm install -g pm2
   git clone https://github.com/YOUR_USERNAME/maasterg-bot.git
   cd maasterg-bot && npm install
   pm2 start bot.js --name maasterg-bot
   ```
3. **Add collaborators:** Invite team members to contribute
4. **Create issues:** Plan features/fixes using GitHub Issues
5. **Document:** Keep README and docs updated

---

## Deploying Updates from GitHub

Your Oracle Cloud VM pulls the latest code straight from GitHub:

1. Push your changes: `git push origin main`
2. SSH into the VM: `ssh -i /path/to/key ubuntu@<your-public-ip>`
3. Pull and restart:
   ```bash
   cd ~/maasterg-bot
   git pull origin main
   npm install
   pm2 restart maasterg-bot
   ```

That's it — every push you pull onto the VM goes live after a `pm2 restart`. You can even wrap these commands in a small shell script or a cron job for one-command deploys.

---

## CLI Commands Cheatsheet

```bash
# Initial setup
git config --global user.name "Name"
git config --global user.email "email@example.com"

# Create repository locally
git init

# Stage all changes
git add .

# Commit changes
git commit -m "message"

# Connect to GitHub
git remote add origin https://github.com/user/repo.git

# Push to GitHub
git push -u origin main

# Future pushes
git push origin main

# Pull latest
git pull origin main

# View status
git status

# View logs
git log --oneline

# Create branch
git checkout -b feature-name

# Switch branch
git checkout main

# Merge branch
git merge feature-name

# Delete branch
git branch -d feature-name

# View all branches
git branch -a

# Update to match GitHub
git fetch origin
```

---

## Security Reminders

✅ **DO:**
- Keep repo on GitHub for backup
- Use strong password
- Enable 2FA on GitHub account
- Review code before pushing
- Keep auth_info/ private

❌ **DON'T:**
- Push auth_info/ to GitHub
- Hardcode API keys in code
- Push .env files
- Share GitHub tokens
- Use weak passwords

---

## Getting Help

- 📖 [GitHub Docs](https://docs.github.com)
- 💬 [GitHub Community](https://github.community)
- 📧 Email: contact@maasterg.org

---

**Ready to push?** Follow steps 1-5 above! 🚀

Questions? Check GitHub documentation or email support.
