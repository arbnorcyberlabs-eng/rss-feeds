# RSS Feed Generator

This project uses [Feed me up, Scotty!](https://feed-me-up-scotty.vincenttunru.com/) to generate RSS feeds from web pages using CSS selectors.

## What is Feed me up, Scotty!?

Feed me up, Scotty! is a tool that allows you to create RSS feeds from any website by scraping content using CSS selectors. It's perfect for:
- Creating RSS feeds for websites that don't have them
- Aggregating content from multiple pages into a single feed
- Filtering and customizing existing feeds

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your system

### Installation
No installation is required! The tool uses `npx` to run directly.

## Usage

### Generate Feeds

Run the following command to generate RSS feeds based on your configuration:

```bash
npm run generate
```

Or directly:

```bash
npx feed-me-up-scotty
```

This will:
1. Read the `feeds.toml` configuration file
2. Scrape the configured websites
3. Generate RSS feed files in the `public/` folder

### Debug Mode

If your feeds aren't working as expected, run in debug mode to see more information:

```bash
npm run generate:debug
```

Or on Windows PowerShell:

```powershell
$env:DEBUG="info"; npx feed-me-up-scotty
```

On Unix/Mac:

```bash
DEBUG="info" npx feed-me-up-scotty
```

## Configuration

Edit the `feeds.toml` file to configure your feeds. Each feed requires:

### Required Fields

- **`title`**: A descriptive title for your feed
- **`url`**: The URL of the page to scrape
- **`entrySelector`**: CSS selector matching individual feed entries
- **`titleSelector`**: CSS selector for the title within each entry
- **`linkSelector`**: CSS selector for the link within each entry

### Optional Fields

- **`contentSelector`**: CSS selector for the content (defaults to full entry)
- **`dateSelector`**: CSS selector for the publication date
- **`dateFormat`**: Format string for the date (using date-fns format)
- **`timeout`**: Seconds to wait for page load (default: 60)
- **`filters`**: Array of strings - exclude entries containing these strings
- **`matchOneOf`**: Array of strings - only include entries with at least one match
- **`matchAllOf`**: Array of strings - only include entries matching all strings

### Example Configuration

```toml
[default]
timeout = 30

[example-feed]
title = "My Custom Feed"
url = "https://example.com"
entrySelector = "article"
titleSelector = "h2"
linkSelector = "a.permalink"
contentSelector = "p.summary"
dateSelector = "time"
filters = ["Advertisement", "Sponsored"]
```

## Output

Generated feeds will be saved in the `public/` folder:
- Individual feeds: `public/{feed-name}.xml`
- Combined feed: `public/all.xml` (contains all posts from all feeds)

## Tips for Finding CSS Selectors

1. **Open Developer Tools** in your browser (F12)
2. **Right-click** on the element you want to select
3. **Select "Inspect"** to see the HTML structure
4. **Identify unique selectors** like classes, IDs, or element combinations
5. **Test your selectors** in the browser console:
   ```javascript
   document.querySelectorAll('your-selector-here')
   ```

## Debugging

If entries aren't being captured correctly:

1. Run with `DEBUG="info"` environment variable
2. Use `:root` as the `entrySelector` to see the full HTML dump
3. Check if the page uses JavaScript to load content (may need `waitUntil` option)
4. Verify selectors in your browser's developer console

### Advanced Options for JavaScript-Heavy Sites

```toml
[dynamic-site]
title = "JavaScript-loaded content"
url = "https://example.com"
waitUntil = "networkidle"  # or "load" or "domcontentloaded"
waitForSelector = ".content-loaded"  # wait for this element to appear
entrySelector = "article"
titleSelector = "h2"
linkSelector = "a"
```

## Automation

This project includes automation configurations for:
- **GitHub Actions + GitHub Pages** - Automatic hosting and updates
- **GitLab CI/CD + GitLab Pages** - Alternative automatic hosting
- **Manual automation** - Cron jobs, Task Scheduler, etc.

### GitHub Actions Setup (Recommended)

This repository is pre-configured to automatically generate and host your feeds using GitHub Actions and GitHub Pages.

**Setup Steps:**

1. **Push this repository to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

2. **Create the gh-pages branch**
   ```bash
   git checkout --orphan gh-pages
   git reset --hard
   git commit --allow-empty -m "Initial gh-pages commit"
   git push origin gh-pages
   git checkout main
   ```

3. **Enable GitHub Pages**
   - Go to your repository Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select `gh-pages` branch and `/ (root)` folder
   - Click Save

4. **Enable GitHub Actions**
   - Go to the Actions tab in your repository
   - Click "I understand my workflows, go ahead and enable them"

**That's it!** Your feeds will:
- Auto-generate twice daily (5:30 AM and 5:30 PM UTC)
- Be available at: `https://YOUR-USERNAME.github.io/YOUR-REPO/feedname.xml`
- Update on every push to main branch
- Can be manually triggered from the Actions tab

### GitLab CI/CD Setup

If you prefer GitLab:

1. **Push this repository to GitLab**
2. **Create a Pipeline Schedule**
   - Go to Build → Pipeline schedules
   - Click "New schedule"
   - Set interval: `30 5,17 * * *` (5:30 AM and 5:30 PM)
   - Save

Your feeds will be at: `https://YOUR-USERNAME.gitlab.io/YOUR-REPO/feedname.xml`

### Manual Automation

You can also run this on your own server or computer using cron jobs or Task Scheduler

## Resources

- [Official Documentation](https://feed-me-up-scotty.vincenttunru.com/docs/setup)
- [Source Code](https://github.com/Vincentdegroot/feed-me-up-scotty)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)

## License

This project configuration is open source. Feed me up, Scotty! is created by Vincent Tunru.

