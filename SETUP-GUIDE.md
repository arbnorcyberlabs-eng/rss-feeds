# Complete Setup Guide - Feed me up, Scotty!

## 📋 Prerequisites
- [ ] Node.js installed on your computer
- [ ] Git installed on your computer
- [ ] A GitHub account (free)

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Test Locally First (Optional but Recommended)

Before deploying, test that everything works on your local machine:

```powershell
# Generate feeds locally
npx feed-me-up-scotty
```

This will create a `public/` folder with your RSS feeds. Check that the feeds look correct.

---

### Step 2: Create a GitHub Repository

1. Go to https://github.com
2. Click the **"+"** button (top right) → **"New repository"**
3. Fill in the details:
   - **Repository name**: `rss-feeds` (or any name you prefer)
   - **Description**: `Automated RSS feed generator`
   - **Visibility**: Public (required for free GitHub Pages)
   - **DO NOT** check "Add a README file"
   - **DO NOT** add .gitignore or license (we already have them)
4. Click **"Create repository"**

GitHub will show you a page with setup instructions. Keep this page open.

---

### Step 3: Initialize Git Locally

Open PowerShell in your project folder and run these commands:

```powershell
# Initialize git repository
git init

# Add all files to staging
git add .

# Create your first commit
git commit -m "Initial commit - RSS feed automation setup"

# Rename the default branch to main (if needed)
git branch -M main
```

---

### Step 4: Connect to GitHub and Push

Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual values:

```powershell
# Add GitHub as remote origin (REPLACE WITH YOUR VALUES)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to GitHub
git push -u origin main
```

**Example:**
```powershell
git remote add origin https://github.com/johndoe/rss-feeds.git
git push -u origin main
```

You may be prompted to log in to GitHub. Use your GitHub credentials.

---

### Step 5: Create the gh-pages Branch

This branch will host your generated RSS feeds:

```powershell
# Create an orphan branch (empty branch)
git checkout --orphan gh-pages

# Remove all files from staging
git reset --hard

# Create an empty commit
git commit --allow-empty -m "Initial gh-pages commit"

# Push the gh-pages branch to GitHub
git push origin gh-pages

# Go back to main branch
git checkout main
```

---

### Step 6: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. Click **Pages** (left sidebar)
4. Under **"Source"**:
   - Select **"Deploy from a branch"**
   - Branch: Select **`gh-pages`**
   - Folder: Select **`/ (root)`**
5. Click **Save**

You'll see a message: "Your site is ready to be published at https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/"

---

### Step 7: Enable GitHub Actions

1. Go to the **Actions** tab in your repository
2. You'll see a message: "Workflows aren't being run on this forked repository"
3. Click **"I understand my workflows, go ahead and enable them"**

---

### Step 8: Trigger Your First Feed Generation

You have three options:

**Option A: Push a change (easiest)**
```powershell
# Make a small change (add a comment to feeds.toml)
echo "# Trigger build" >> feeds.toml
git add feeds.toml
git commit -m "Trigger first build"
git push
```

**Option B: Manual trigger**
1. Go to **Actions** tab
2. Click **"Generate RSS Feeds"** workflow (left sidebar)
3. Click **"Run workflow"** dropdown
4. Click green **"Run workflow"** button

**Option C: Wait for scheduled run**
- Feeds will auto-generate at 5:30 AM and 5:30 PM UTC

---

### Step 9: Verify Everything Works

1. **Check GitHub Actions:**
   - Go to **Actions** tab
   - You should see a workflow running or completed
   - Click on it to see the logs
   - Make sure all steps show green checkmarks ✓

2. **Check GitHub Pages:**
   - Go to **Settings → Pages**
   - You should see: "Your site is live at https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/"
   - Click the link

3. **Access Your Feeds:**
   Your RSS feeds will be available at:
   - `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/funfacts.xml`
   - `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/wikivoyage.xml`
   - `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/hackernews.xml`
   - `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/all.xml` (combined feed)

---

## 🎯 What Happens Next?

### Automatic Updates
- ✅ Feeds regenerate **twice daily** (5:30 AM & 5:30 PM UTC)
- ✅ Feeds regenerate on **every push** to main branch
- ✅ You can **manually trigger** regeneration from Actions tab

### Using Your Feeds
Add the feed URLs to your favorite RSS reader:
- Feedly
- Inoreader
- NewsBlur
- Thunderbird
- Any RSS reader app

---

## 🔧 Customizing Your Feeds

### Add a New Feed

1. Edit `feeds.toml` and add a new section:
   ```toml
   [my-new-feed]
   title = "My Custom Feed"
   url = "https://example.com"
   entrySelector = "article"
   titleSelector = "h2"
   linkSelector = "a"
   ```

2. Push the changes:
   ```powershell
   git add feeds.toml
   git commit -m "Add new feed"
   git push
   ```

3. Wait a few minutes for GitHub Actions to rebuild

4. Your new feed will be at:
   `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/my-new-feed.xml`

### Change Update Frequency

Edit `.github/workflows/generate-feeds.yml`:

```yaml
schedule:
  - cron: '30 5,17 * * *'  # Change this line
```

Common schedules:
- Every hour: `'0 * * * *'`
- Every 6 hours: `'0 */6 * * *'`
- Once daily at noon: `'0 12 * * *'`
- Every 30 minutes: `'*/30 * * * *'`

---

## 🐛 Troubleshooting

### GitHub Actions fails
1. Check the Actions tab for error details
2. Common issues:
   - Invalid CSS selectors in `feeds.toml`
   - Website blocking the scraper
   - Timeout issues (increase timeout in feeds.toml)

### Feeds not updating
1. Check that gh-pages branch exists
2. Verify GitHub Pages is enabled and set to gh-pages branch
3. Check Actions tab for successful runs

### 404 Error on feed URLs
1. Make sure GitHub Pages is enabled
2. Wait 2-3 minutes after first deployment
3. Check the exact URL format

---

## 📚 Useful Commands

```powershell
# Test feeds locally
npx feed-me-up-scotty

# Test with debug output
$env:DEBUG="info"; npx feed-me-up-scotty

# Check git status
git status

# See recent commits
git log --oneline -5

# Pull latest changes
git pull

# Force regenerate feeds
git commit --allow-empty -m "Force regenerate"
git push
```

---

## 🎓 Next Steps

1. ✅ Complete the setup steps above
2. ✅ Verify your feeds are working
3. ✅ Add your feeds to an RSS reader
4. ✅ Customize the feeds in `feeds.toml`
5. ✅ Share your feed URLs!

---

## 📖 Resources

- [Official Documentation](https://feed-me-up-scotty.vincenttunru.com/docs/setup)
- [CSS Selectors Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 💡 Tips

- Test CSS selectors in browser console: `document.querySelectorAll('your-selector')`
- Use browser DevTools (F12) to inspect elements
- Start with simple selectors and refine as needed
- Keep the timeout at 30s unless sites load slowly
- Check the Actions tab regularly for issues

---

Good luck! 🚀

