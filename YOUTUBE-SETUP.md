# Adding YouTube Channel RSS Feeds

YouTube channels have native RSS/Atom feeds that are much more reliable than scraping the website.

## How to Get a YouTube Channel's RSS Feed URL

### Method 1: From Channel Page Source

1. Visit the YouTube channel: `https://www.youtube.com/@EconomyMedia`
2. Right-click and select **"View Page Source"** (or press `Ctrl+U`)
3. Search for `"channelId"` in the source code (Ctrl+F)
4. Copy the channel ID (format: `UC...` or similar)
5. Use this URL format:
   ```
   https://www.youtube.com/feeds/videos.xml?channel_id=PASTE_CHANNEL_ID_HERE
   ```

### Method 2: From Channel URL

1. If you see a URL like: `https://www.youtube.com/channel/UCxxxxx`
2. The part after `/channel/` is the channel ID
3. Use format: `https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxx`

### Method 3: Using Online Tools

1. Use a YouTube Channel ID finder tool
2. Enter: `https://www.youtube.com/@EconomyMedia`
3. Get the channel ID
4. Use the RSS feed format above

## Example for Economy Media

1. Visit: https://www.youtube.com/@EconomyMedia
2. Get the channel ID from page source
3. Update `feeds.toml` with the correct RSS feed URL

Example configuration in `feeds.toml`:

```toml
[economymedia]
title = "Economy Media YouTube"
url = "https://www.youtube.com/feeds/videos.xml?channel_id=YOUR_CHANNEL_ID_HERE"
```

**Note:** YouTube RSS feeds are native XML feeds, so you **don't need** selectors (`entrySelector`, `titleSelector`, etc.) - just the URL!

## After Getting the Channel ID

1. Update the `url` line in `feeds.toml`
2. Remove all the selector lines (they're not needed for native RSS)
3. Commit and push:
   ```bash
   git add feeds.toml
   git commit -m "Add Economy Media YouTube RSS feed"
   git push
   ```

The feed will automatically update on the next GitHub Actions run!

