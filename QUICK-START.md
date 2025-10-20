# Quick Start - Commands to Run

Copy and paste these commands in order. Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual GitHub username and repository name.

---

## 1️⃣ Test Locally (Optional)

```powershell
npx feed-me-up-scotty
```

Check the `public/` folder for generated feeds.

---

## 2️⃣ Create GitHub Repository

🌐 Go to: https://github.com/new

- Repository name: `rss-feeds` (or your choice)
- Public repository
- **Don't** add README, .gitignore, or license
- Click "Create repository"

---

## 3️⃣ Run These Commands in PowerShell

```powershell
# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit - RSS feed automation setup"

# Rename branch to main
git branch -M main

# Connect to GitHub (REPLACE WITH YOUR VALUES!)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to GitHub
git push -u origin main
```

**EXAMPLE:**
```powershell
git remote add origin https://github.com/johndoe/rss-feeds.git
git push -u origin main
```

---

## 4️⃣ Create gh-pages Branch

```powershell
# Create gh-pages branch
git checkout --orphan gh-pages

# Clear staging
git reset --hard

# Initial commit
git commit --allow-empty -m "Initial gh-pages commit"

# Push to GitHub
git push origin gh-pages

# Return to main
git checkout main
```

---

## 5️⃣ Enable GitHub Pages

1. Go to your repo: `https://github.com/YOUR-USERNAME/YOUR-REPO-NAME`
2. Click **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **gh-pages**, Folder: **/ (root)**
5. Click **Save**

---

## 6️⃣ Enable GitHub Actions

1. Click **Actions** tab
2. Click **"I understand my workflows, go ahead and enable them"**

---

## 7️⃣ Trigger First Build

```powershell
# Make a small change to trigger the build
echo "# Trigger" >> feeds.toml
git add feeds.toml
git commit -m "Trigger first build"
git push
```

---

## 8️⃣ Check Your Feeds

Wait 2-3 minutes, then visit:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/funfacts.xml
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/wikivoyage.xml
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/hackernews.xml
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/all.xml
```

---

## ✅ Done!

Your feeds will now auto-update twice daily at 5:30 AM and 5:30 PM UTC.

Add these URLs to your RSS reader and enjoy! 🎉

