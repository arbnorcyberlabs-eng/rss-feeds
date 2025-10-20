# Twitter/X RSS Feed Integration Guide

## Current Status (2025)

❌ **Twitter/X no longer provides free native RSS feeds**

Twitter removed their RSS feed feature years ago. However, there are several alternative approaches to include Twitter content in your RSS feed reader.

---

## Options for Including Twitter/X Content

### Option 1: Twitter API v2 (Official)

**Pros:**
- Official and reliable
- Real-time data
- Full tweet metadata

**Cons:**
- Requires Twitter Developer Account
- Rate limits on free tier (very restrictive)
- Complex authentication (OAuth 2.0)
- Monthly fees for higher tiers

**Steps:**
1. Create a Twitter Developer Account at https://developer.twitter.com/
2. Create a new app and get API keys
3. Use the `/users/:id/tweets` endpoint to fetch tweets
4. Transform JSON response to RSS/Atom format

**Free Tier Limits:**
- 500,000 tweets read per month
- 10,000 tweets read per month for Essential access
- Rate limit: 900 requests per 15 minutes

**Cost:**
- Free: Very limited (10K tweets/month)
- Basic: $100/month (up to 10K tweets/month)
- Pro: $5,000/month (up to 1M tweets/month)

---

### Option 2: Third-Party RSS Services (Recommended)

Several services convert Twitter accounts to RSS feeds:

#### a) **Nitter (Self-Hosted or Public Instances)**

**What is Nitter?**
A free and open-source alternative Twitter front-end focused on privacy.

**Pros:**
- Free
- No API keys needed
- Provides RSS feeds automatically
- Privacy-friendly (no tracking)
- Can be self-hosted

**Cons:**
- Twitter actively blocks Nitter instances
- Public instances are unreliable
- May require frequent instance switching
- Self-hosting requires technical knowledge

**Usage:**
```
https://nitter.net/[username]/rss
```

**Popular Nitter Instances (as of 2025):**
- https://nitter.net/
- https://nitter.it/
- https://nitter.privacydev.net/
- https://nitter.poast.org/

**Example:**
```
https://nitter.net/elonmusk/rss
```

**Note:** Many Nitter instances are down or blocked by Twitter. You may need to find working instances at: https://github.com/zedeus/nitter/wiki/Instances

#### b) **RSS.app**

**Website:** https://rss.app/

**Pros:**
- Easy to use
- Web-based interface
- Supports multiple social platforms
- Reliable uptime

**Cons:**
- Free tier is very limited (3 feeds)
- Paid plans required for more feeds
- $9.99/month for 20 feeds
- $19.99/month for unlimited feeds

**Usage:**
1. Go to https://rss.app/
2. Enter Twitter profile URL
3. Get generated RSS feed URL

#### c) **RSSHub**

**Website:** https://docs.rsshub.app/

**Pros:**
- Open-source
- Can be self-hosted
- Supports many social platforms
- Active development community

**Cons:**
- Public instances may be slow or blocked
- Self-hosting requires technical knowledge
- May require proxy configuration

**Twitter Route:**
```
https://rsshub.app/twitter/user/[username]
```

**Example:**
```
https://rsshub.app/twitter/user/elonmusk
```

**Self-Hosted Setup:**
```bash
# Using Docker
docker run -d --name rsshub -p 1200:1200 diygod/rsshub

# Then access feeds at:
http://localhost:1200/twitter/user/[username]
```

#### d) **Tweepy + Custom RSS Generator** (DIY Approach)

If you have programming skills, you can create your own solution:

**Requirements:**
- Python 3.x
- Tweepy library
- Twitter API credentials

**Basic Example:**
```python
import tweepy
from feedgen.feed import FeedGenerator
import os

# Twitter API credentials
bearer_token = "YOUR_BEARER_TOKEN"

# Initialize Tweepy client
client = tweepy.Client(bearer_token=bearer_token)

# Fetch tweets
user = client.get_user(username='elonmusk')
tweets = client.get_users_tweets(user.data.id, max_results=10)

# Generate RSS feed
fg = FeedGenerator()
fg.title('Twitter Feed - @elonmusk')
fg.link(href='https://twitter.com/elonmusk')
fg.description('Latest tweets from @elonmusk')

for tweet in tweets.data:
    fe = fg.add_entry()
    fe.title(tweet.text[:50] + '...')
    fe.link(href=f'https://twitter.com/user/status/{tweet.id}')
    fe.description(tweet.text)
    fe.published(tweet.created_at)

# Save RSS feed
fg.rss_file('twitter_feed.rss')
```

---

### Option 3: Web Scraping (Risky)

**Not Recommended** - Twitter actively fights against scraping and may ban your IP.

**Tools:**
- BeautifulSoup (Python)
- Playwright (for JavaScript-heavy sites)
- Puppeteer (Node.js)

**Legal Risks:**
- Violates Twitter's Terms of Service
- May result in IP bans
- Unstable (breaks when Twitter changes their HTML)

---

## Recommended Approach for Your RSS Feed Aggregator

### Short-Term Solution: Use Nitter

1. **Find a Working Nitter Instance**
   - Check https://github.com/zedeus/nitter/wiki/Instances
   - Test multiple instances to find working ones

2. **Add to Your `feeds.toml`**
   ```toml
   [twitter_account]
   title = "Twitter - @username"
   url = "https://nitter.net/username"
   entrySelector = ".timeline-item"
   titleSelector = ".tweet-content"
   linkSelector = ".tweet-link"
   contentSelector = ".tweet-content"
   ```

3. **Problem:** This may break frequently as Twitter blocks Nitter instances.

### Long-Term Solution: Self-Hosted RSSHub

This is the most reliable free option if you're willing to self-host:

1. **Deploy RSSHub on Your Server**
   ```bash
   # Using Docker Compose
   version: '3'
   services:
     rsshub:
       image: diygod/rsshub
       ports:
         - '1200:1200'
       environment:
         - NODE_ENV=production
       restart: always
   ```

2. **Use GitHub Actions to Fetch Twitter Feeds**
   - Set up a scheduled action to fetch tweets via RSSHub
   - Convert to RSS and commit to your repository
   - No client-side CORS issues

3. **Example GitHub Actions Workflow:**
   ```yaml
   name: Fetch Twitter Feeds
   
   on:
     schedule:
       - cron: '0 */6 * * *'  # Every 6 hours
     workflow_dispatch:
   
   jobs:
     fetch-twitter:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Fetch Twitter RSS via RSSHub
           run: |
             curl "https://rsshub.app/twitter/user/username" -o twitter.xml
             
         - name: Commit Twitter feed
           run: |
             git config --local user.email "action@github.com"
             git config --local user.name "GitHub Action"
             git add twitter.xml
             git commit -m "Update Twitter feed" || echo "No changes"
             git push
   ```

---

## Best Free Option (Recommended)

**Use RSSHub Public Instance or Self-Host**

### Quick Setup:

1. **Test RSSHub:**
   ```
   https://rsshub.app/twitter/user/your_username
   ```

2. **If it works, add to your client-side fetcher:**
   
   Update your `index.html` to include Twitter the same way you do YouTube:
   
   ```javascript
   const twitterRssFeed = 'https://rsshub.app/twitter/user/your_username';
   
   // Fetch via CORS proxy (same as YouTube)
   async function fetchTwitterFeed(forceUpdate = false) {
       const proxyUrl = corsProxies[0] + encodeURIComponent(twitterRssFeed);
       const response = await fetch(proxyUrl);
       return await response.text();
   }
   ```

3. **Add caching** (same as YouTube implementation)

---

## Comparison Table

| Method | Cost | Reliability | Ease of Setup | Legal |
|--------|------|-------------|---------------|-------|
| Twitter API (Official) | $0-5000/month | ⭐⭐⭐⭐⭐ | ⭐⭐ | ✅ Yes |
| Nitter (Public) | Free | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Gray area |
| RSSHub (Public) | Free | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Gray area |
| RSSHub (Self-Hosted) | Free/Server cost | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Gray area |
| RSS.app | $9.99-19.99/mo | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Web Scraping | Free | ⭐ | ⭐⭐ | ❌ No |

---

## Alternative: Mastodon

If the goal is to follow individuals or organizations, consider suggesting they move to **Mastodon**, which has built-in RSS feed support:

```
https://mastodon.social/@username.rss
```

Every Mastodon account automatically has an RSS feed!

---

## Conclusion

**For Your Project:**

1. **Start with RSSHub public instance** - Quick and easy
2. **If RSSHub gets blocked** - Switch to different instance or self-host
3. **If you need reliability** - Consider paying for RSS.app
4. **If you have budget** - Use official Twitter API

**My Recommendation:**
Use **RSSHub** via your existing CORS proxy setup (same as YouTube). This is free, relatively reliable, and requires no additional infrastructure.

---

## Implementation Example

Here's how to add Twitter to your current setup:

### 1. Add to JavaScript (in `index.html`):

```javascript
// Add Twitter configuration
const twitterUsername = 'elonmusk'; // Change to desired username
const twitterRssFeed = `https://rsshub.app/twitter/user/${twitterUsername}`;
const TWITTER_CACHE_KEY = 'twitter_feed_cache';
const TWITTER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Update feedNames
const feedNames = {
    'all': 'Combined Feed',
    'funfacts': 'Wikipedia — did you know?',
    'wikivoyage': 'Wikivoyage recommendations',
    'hackernews': 'Hacker News - Front Page',
    'economymedia': 'Economy Media YouTube',
    'twitter': `Twitter - @${twitterUsername}`
};
```

### 2. Add button in HTML:

```html
<button class="feed-button" data-feed="twitter">Twitter</button>
```

### 3. Add fetch logic (similar to YouTube):

```javascript
async function fetchTwitterFeed(forceUpdate = false) {
    // Check cache first
    if (!forceUpdate) {
        const cached = getCachedFeed(TWITTER_CACHE_KEY, TWITTER_CACHE_DURATION);
        if (cached) return cached;
    }

    // Try each proxy
    for (let i = 0; i < corsProxies.length; i++) {
        try {
            const proxyUrl = corsProxies[i] + encodeURIComponent(twitterRssFeed);
            const response = await fetch(proxyUrl, {
                cache: forceUpdate ? 'reload' : 'default',
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const text = await response.text();
                cacheFeed(TWITTER_CACHE_KEY, text);
                return text;
            }
        } catch (error) {
            console.warn(`Proxy ${i + 1} failed for Twitter:`, error.message);
            if (i === corsProxies.length - 1) throw error;
        }
    }
    
    throw new Error('All proxies failed for Twitter');
}
```

This will integrate Twitter into your existing feed reader with the same caching and proxy logic you're using for YouTube!

---

**Note:** Twitter/X's API policies and third-party service availability change frequently. Always check the current status of any service before relying on it for production use.

---

*Last Updated: October 20, 2025*

