# Feed Management Migration Plan

## Overview

This document outlines two scalable solutions for managing RSS feed configurations dynamically through a web interface, eliminating the need for manual `feeds.toml` editing and GitHub commits.

---

## Solution 1: Hybrid Firebase/Supabase Backend

### Architecture Overview

This solution uses a backend-as-a-service (BaaS) platform to store feed configurations, combined with GitHub Actions for feed generation.

```
┌─────────────────┐
│   Web Admin UI  │ (Add/Remove Feeds)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Firebase/       │ (Store Feed Config)
│ Supabase DB     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │ (Fetch Config → Generate Feeds)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Pages   │ (Serve Feeds + UI)
└─────────────────┘
```

### Prerequisites

- Firebase account (free tier sufficient) OR Supabase account
- Current GitHub repository with Feed me up, Scotty setup
- Basic understanding of JavaScript and REST APIs

---

### Phase 1: Database Setup (2-3 hours)

#### Option A: Firebase Setup

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init firestore
   ```

2. **Create Firestore Database Structure**
   ```javascript
   // Collection: feeds
   // Document structure:
   {
     id: "hackernews",           // Feed identifier
     title: "Hacker News",       // Display name
     enabled: true,              // Active status
     type: "scraped",            // "scraped" or "native_rss"
     config: {
       // For scraped feeds
       url: ["https://news.ycombinator.com/"],
       entrySelector: ".athing",
       titleSelector: ".titleline > a",
       linkSelector: ".titleline > a",
       contentSelector: ".titleline > a"
     },
     // For native RSS feeds
     rssUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=...",
     createdAt: timestamp,
     updatedAt: timestamp,
     order: 1                    // Display order
   }
   ```

3. **Configure Firestore Security Rules**
   ```javascript
   // firestore.rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /feeds/{feedId} {
         // Public read access
         allow read: if true;
         
         // Authenticated write access only
         allow write: if request.auth != null && 
                        request.auth.token.admin == true;
       }
     }
   }
   ```

4. **Set Up Firebase Authentication**
   - Enable Email/Password authentication in Firebase Console
   - Create admin user account
   - Add custom claim `admin: true` to user:
   ```javascript
   // Run once in Firebase Functions or Admin SDK
   admin.auth().setCustomUserClaims(uid, { admin: true });
   ```

#### Option B: Supabase Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note down API URL and anon key

2. **Create Database Table**
   ```sql
   -- Create feeds table
   CREATE TABLE feeds (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     enabled BOOLEAN DEFAULT true,
     type TEXT CHECK (type IN ('scraped', 'native_rss')),
     config JSONB,
     rss_url TEXT,
     display_order INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create index for ordering
   CREATE INDEX idx_feeds_order ON feeds(display_order);

   -- Enable Row Level Security
   ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;

   -- Policy: Anyone can read feeds
   CREATE POLICY "Public feeds are viewable by everyone"
   ON feeds FOR SELECT
   USING (true);

   -- Policy: Only authenticated admins can modify
   CREATE POLICY "Admins can insert feeds"
   ON feeds FOR INSERT
   WITH CHECK (auth.role() = 'authenticated');

   CREATE POLICY "Admins can update feeds"
   ON feeds FOR UPDATE
   USING (auth.role() = 'authenticated');

   CREATE POLICY "Admins can delete feeds"
   ON feeds FOR DELETE
   USING (auth.role() = 'authenticated');
   ```

3. **Set Up Authentication**
   - Enable Email authentication in Supabase Dashboard
   - Create admin user account

---

### Phase 2: Admin Web Interface (8-12 hours)

Create `admin.html` in your repository:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSS Feed Admin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'HandWide', sans-serif;
            background: #ffffff;
            color: #000000;
            padding: 40px 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            border-bottom: 3px solid #000000;
            padding-bottom: 10px;
        }

        .auth-section {
            background: #f5f5f5;
            padding: 30px;
            margin-bottom: 40px;
            border: 2px solid #000000;
        }

        .auth-section input {
            padding: 12px;
            margin-right: 10px;
            border: 2px solid #000000;
            font-family: 'HandWide', sans-serif;
            font-size: 1em;
        }

        .btn {
            padding: 12px 30px;
            background: #000000;
            color: #ffffff;
            border: none;
            cursor: pointer;
            font-family: 'HandWide', sans-serif;
            font-size: 1em;
            font-weight: 700;
            transition: all 0.2s ease;
        }

        .btn:hover {
            background: #333333;
        }

        .btn-secondary {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
        }

        .btn-secondary:hover {
            background: #f5f5f5;
        }

        .btn-danger {
            background: #cc0000;
        }

        .btn-danger:hover {
            background: #990000;
        }

        .feed-list {
            margin-top: 40px;
        }

        .feed-item {
            background: #f5f5f5;
            padding: 25px;
            margin-bottom: 20px;
            border: 2px solid #000000;
            position: relative;
        }

        .feed-item h3 {
            font-size: 1.5em;
            margin-bottom: 10px;
        }

        .feed-item .feed-type {
            display: inline-block;
            background: #000000;
            color: #ffffff;
            padding: 4px 10px;
            font-size: 0.7em;
            font-weight: 700;
            text-transform: uppercase;
            margin-left: 10px;
        }

        .feed-item .feed-status {
            display: inline-block;
            padding: 4px 10px;
            font-size: 0.7em;
            font-weight: 700;
            text-transform: uppercase;
            margin-left: 10px;
        }

        .feed-item .feed-status.active {
            background: #00cc00;
            color: #ffffff;
        }

        .feed-item .feed-status.disabled {
            background: #cccccc;
            color: #666666;
        }

        .feed-controls {
            margin-top: 15px;
        }

        .feed-controls button {
            margin-right: 10px;
            margin-bottom: 10px;
        }

        .add-feed-section {
            background: #e8e8e8;
            padding: 30px;
            margin-bottom: 40px;
            border: 3px solid #000000;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 1.1em;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #000000;
            font-family: 'HandWide', sans-serif;
            font-size: 1em;
        }

        .form-group textarea {
            min-height: 120px;
            font-family: monospace;
        }

        .hidden {
            display: none;
        }

        .alert {
            padding: 15px;
            margin-bottom: 20px;
            border: 2px solid #000000;
            font-weight: 700;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
        }

        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
        }

        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2em;
        }

        .feed-config-preview {
            background: #ffffff;
            padding: 15px;
            border: 1px solid #000000;
            font-family: monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>RSS Feed Admin Panel</h1>

        <!-- Authentication Section -->
        <div id="auth-section" class="auth-section">
            <h2>Login</h2>
            <div style="margin-top: 20px;">
                <input type="email" id="email" placeholder="Email" />
                <input type="password" id="password" placeholder="Password" />
                <button class="btn" onclick="login()">Login</button>
            </div>
            <div id="auth-message" style="margin-top: 15px;"></div>
        </div>

        <!-- Main Content (hidden until logged in) -->
        <div id="main-content" class="hidden">
            <div style="margin-bottom: 30px;">
                <p>Logged in as: <strong id="user-email"></strong></p>
                <button class="btn btn-secondary" onclick="logout()">Logout</button>
            </div>

            <div id="alert-container"></div>

            <!-- Add New Feed Section -->
            <div class="add-feed-section">
                <h2>Add New Feed</h2>
                
                <div class="form-group">
                    <label for="feed-id">Feed ID (unique identifier, lowercase, no spaces):</label>
                    <input type="text" id="feed-id" placeholder="e.g., techcrunch" />
                </div>

                <div class="form-group">
                    <label for="feed-title">Display Title:</label>
                    <input type="text" id="feed-title" placeholder="e.g., TechCrunch News" />
                </div>

                <div class="form-group">
                    <label for="feed-type">Feed Type:</label>
                    <select id="feed-type" onchange="toggleFeedTypeConfig()">
                        <option value="scraped">Scraped Feed (using Feed me up, Scotty)</option>
                        <option value="native_rss">Native RSS/Atom Feed</option>
                    </select>
                </div>

                <!-- Configuration for Scraped Feeds -->
                <div id="scraped-config">
                    <div class="form-group">
                        <label for="feed-url">Page URL(s) (one per line for multiple pages):</label>
                        <textarea id="feed-url" placeholder="https://example.com/news&#10;https://example.com/news?page=2"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="entry-selector">Entry Selector (CSS):</label>
                        <input type="text" id="entry-selector" placeholder="e.g., .article, article.post" />
                    </div>

                    <div class="form-group">
                        <label for="title-selector">Title Selector (CSS):</label>
                        <input type="text" id="title-selector" placeholder="e.g., h2 a, .title" />
                    </div>

                    <div class="form-group">
                        <label for="link-selector">Link Selector (CSS):</label>
                        <input type="text" id="link-selector" placeholder="e.g., h2 a, a.permalink" />
                    </div>

                    <div class="form-group">
                        <label for="content-selector">Content Selector (CSS, optional):</label>
                        <input type="text" id="content-selector" placeholder="e.g., .excerpt, .summary" />
                    </div>
                </div>

                <!-- Configuration for Native RSS Feeds -->
                <div id="native-rss-config" class="hidden">
                    <div class="form-group">
                        <label for="rss-url">RSS/Atom Feed URL:</label>
                        <input type="text" id="rss-url" placeholder="https://example.com/feed.xml" />
                    </div>
                </div>

                <button class="btn" onclick="addFeed()">Add Feed</button>
                <button class="btn btn-secondary" onclick="clearForm()">Clear Form</button>
            </div>

            <!-- Feed List Section -->
            <div class="feed-list">
                <h2>Current Feeds</h2>
                <div id="loading" class="loading">Loading feeds...</div>
                <div id="feed-list-container"></div>
            </div>
        </div>
    </div>

    <!-- Firebase Option -->
    <script type="module">
        // FIREBASE CONFIGURATION
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
        import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

        // TODO: Replace with your Firebase config
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_PROJECT_ID.appspot.com",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Make functions globally available
        window.auth = auth;
        window.db = db;
        window.feedsCollection = collection(db, 'feeds');

        // Auth state observer
        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                document.getElementById('user-email').textContent = user.email;
                loadFeeds();
            } else {
                document.getElementById('auth-section').classList.remove('hidden');
                document.getElementById('main-content').classList.add('hidden');
            }
        });

        window.login = async function() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('auth-message');

            try {
                await signInWithEmailAndPassword(auth, email, password);
                messageDiv.innerHTML = '<div class="alert alert-success">Login successful!</div>';
            } catch (error) {
                messageDiv.innerHTML = `<div class="alert alert-error">Login failed: ${error.message}</div>`;
            }
        };

        window.logout = async function() {
            await signOut(auth);
        };

        window.loadFeeds = async function() {
            const container = document.getElementById('feed-list-container');
            const loading = document.getElementById('loading');
            
            try {
                const q = query(window.feedsCollection, orderBy('display_order'));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    container.innerHTML = '<p>No feeds configured yet.</p>';
                    loading.classList.add('hidden');
                    return;
                }

                let html = '';
                querySnapshot.forEach((doc) => {
                    const feed = doc.data();
                    const statusClass = feed.enabled ? 'active' : 'disabled';
                    const statusText = feed.enabled ? 'Active' : 'Disabled';
                    
                    html += `
                        <div class="feed-item">
                            <h3>
                                ${feed.title}
                                <span class="feed-type">${feed.type}</span>
                                <span class="feed-status ${statusClass}">${statusText}</span>
                            </h3>
                            <p><strong>ID:</strong> ${feed.id}</p>
                            ${feed.type === 'native_rss' ? 
                                `<p><strong>RSS URL:</strong> ${feed.rss_url}</p>` :
                                `<div class="feed-config-preview">${JSON.stringify(feed.config, null, 2)}</div>`
                            }
                            <div class="feed-controls">
                                <button class="btn btn-secondary" onclick="toggleFeedStatus('${doc.id}', ${!feed.enabled})">
                                    ${feed.enabled ? 'Disable' : 'Enable'}
                                </button>
                                <button class="btn btn-danger" onclick="deleteFeed('${doc.id}', '${feed.title}')">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;
                loading.classList.add('hidden');
            } catch (error) {
                showAlert('Error loading feeds: ' + error.message, 'error');
                loading.classList.add('hidden');
            }
        };

        window.addFeed = async function() {
            const feedId = document.getElementById('feed-id').value.trim();
            const feedTitle = document.getElementById('feed-title').value.trim();
            const feedType = document.getElementById('feed-type').value;

            if (!feedId || !feedTitle) {
                showAlert('Feed ID and Title are required!', 'error');
                return;
            }

            const feedData = {
                id: feedId,
                title: feedTitle,
                type: feedType,
                enabled: true,
                display_order: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (feedType === 'scraped') {
                const urlText = document.getElementById('feed-url').value.trim();
                const urls = urlText.split('\n').map(u => u.trim()).filter(u => u);
                
                feedData.config = {
                    url: urls.length === 1 ? urls[0] : urls,
                    entrySelector: document.getElementById('entry-selector').value.trim(),
                    titleSelector: document.getElementById('title-selector').value.trim(),
                    linkSelector: document.getElementById('link-selector').value.trim(),
                    contentSelector: document.getElementById('content-selector').value.trim()
                };

                if (!urls.length || !feedData.config.entrySelector || !feedData.config.titleSelector || !feedData.config.linkSelector) {
                    showAlert('All scraped feed fields (except content) are required!', 'error');
                    return;
                }
            } else {
                feedData.rss_url = document.getElementById('rss-url').value.trim();
                if (!feedData.rss_url) {
                    showAlert('RSS URL is required!', 'error');
                    return;
                }
            }

            try {
                await addDoc(window.feedsCollection, feedData);
                showAlert('Feed added successfully! GitHub Actions will generate it on the next run.', 'success');
                clearForm();
                loadFeeds();
            } catch (error) {
                showAlert('Error adding feed: ' + error.message, 'error');
            }
        };

        window.toggleFeedStatus = async function(docId, enabled) {
            try {
                await updateDoc(doc(window.db, 'feeds', docId), {
                    enabled: enabled,
                    updatedAt: new Date()
                });
                showAlert(`Feed ${enabled ? 'enabled' : 'disabled'} successfully!`, 'success');
                loadFeeds();
            } catch (error) {
                showAlert('Error updating feed: ' + error.message, 'error');
            }
        };

        window.deleteFeed = async function(docId, feedTitle) {
            if (!confirm(`Are you sure you want to delete "${feedTitle}"? This action cannot be undone.`)) {
                return;
            }

            try {
                await deleteDoc(doc(window.db, 'feeds', docId));
                showAlert('Feed deleted successfully!', 'success');
                loadFeeds();
            } catch (error) {
                showAlert('Error deleting feed: ' + error.message, 'error');
            }
        };

        window.toggleFeedTypeConfig = function() {
            const feedType = document.getElementById('feed-type').value;
            const scrapedConfig = document.getElementById('scraped-config');
            const nativeConfig = document.getElementById('native-rss-config');

            if (feedType === 'scraped') {
                scrapedConfig.classList.remove('hidden');
                nativeConfig.classList.add('hidden');
            } else {
                scrapedConfig.classList.add('hidden');
                nativeConfig.classList.remove('hidden');
            }
        };

        window.clearForm = function() {
            document.getElementById('feed-id').value = '';
            document.getElementById('feed-title').value = '';
            document.getElementById('feed-type').value = 'scraped';
            document.getElementById('feed-url').value = '';
            document.getElementById('entry-selector').value = '';
            document.getElementById('title-selector').value = '';
            document.getElementById('link-selector').value = '';
            document.getElementById('content-selector').value = '';
            document.getElementById('rss-url').value = '';
            toggleFeedTypeConfig();
        };

        window.showAlert = function(message, type) {
            const container = document.getElementById('alert-container');
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.textContent = message;
            container.appendChild(alertDiv);

            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        };
    </script>
</body>
</html>
```

---

### Phase 3: GitHub Actions Integration (3-4 hours)

Update `.github/workflows/generate-feeds.yml` to fetch configuration from Firebase/Supabase:

```yaml
name: Generate RSS Feeds

on:
  schedule:
    - cron: '30 5,17 * * *'
  workflow_dispatch:
  push:
    branches:
      - main
      - master

permissions:
  contents: write

jobs:
  generate-feeds:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps firefox
      
      - name: Install dependencies
        run: npm install axios dotenv
      
      - name: Fetch feed config and generate feeds.toml
        env:
          # For Firebase
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          # OR for Supabase
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: node fetch-feeds-config.js
      
      - name: Generate RSS feeds
        env:
          CI_PAGES_URL: https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/
        run: npx feed-me-up-scotty
      
      - name: Copy index.html and admin.html to public folder
        run: |
          cp index.html public/index.html
          cp admin.html public/admin.html
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: gh-pages
          user_name: 'github-actions[bot]'
          user_email: 'github-actions[bot]@users.noreply.github.com'
          commit_message: 'Update RSS feeds'
```

Create `fetch-feeds-config.js`:

```javascript
const fs = require('fs');
const axios = require('axios');

// Choose your backend
const USE_FIREBASE = true; // Set to false for Supabase

async function fetchFromFirebase() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const apiKey = process.env.FIREBASE_API_KEY;
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/feeds`;
    
    const response = await axios.get(url, {
        params: { key: apiKey }
    });
    
    return response.data.documents.map(doc => {
        const fields = doc.fields;
        return {
            id: fields.id.stringValue,
            title: fields.title.stringValue,
            enabled: fields.enabled.booleanValue,
            type: fields.type.stringValue,
            config: fields.config ? JSON.parse(JSON.stringify(fields.config.mapValue.fields)) : null,
            rss_url: fields.rss_url?.stringValue
        };
    });
}

async function fetchFromSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    
    const response = await axios.get(`${url}/rest/v1/feeds?order=display_order`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    
    return response.data;
}

function convertFieldValue(field) {
    if (!field) return '';
    
    // Handle Firebase field structure
    if (field.stringValue !== undefined) return field.stringValue;
    if (field.arrayValue) {
        return field.arrayValue.values.map(v => v.stringValue);
    }
    
    return field;
}

function generateToml(feeds) {
    let toml = '# Auto-generated from database\n# Do not edit manually - use admin panel\n\n';
    
    const enabledFeeds = feeds.filter(f => f.enabled && f.type === 'scraped');
    
    for (const feed of enabledFeeds) {
        toml += `[${feed.id}]\n`;
        toml += `title = "${feed.title}"\n`;
        
        if (USE_FIREBASE) {
            const config = feed.config;
            const url = convertFieldValue(config.url);
            
            if (Array.isArray(url)) {
                toml += `url = [${url.map(u => `"${u}"`).join(', ')}]\n`;
            } else {
                toml += `url = "${url}"\n`;
            }
            
            toml += `entrySelector = "${convertFieldValue(config.entrySelector)}"\n`;
            toml += `titleSelector = "${convertFieldValue(config.titleSelector)}"\n`;
            toml += `linkSelector = "${convertFieldValue(config.linkSelector)}"\n`;
            
            const contentSelector = convertFieldValue(config.contentSelector);
            if (contentSelector) {
                toml += `contentSelector = "${contentSelector}"\n`;
            }
        } else {
            // Supabase structure is simpler
            const config = feed.config;
            
            if (Array.isArray(config.url)) {
                toml += `url = [${config.url.map(u => `"${u}"`).join(', ')}]\n`;
            } else {
                toml += `url = "${config.url}"\n`;
            }
            
            toml += `entrySelector = "${config.entrySelector}"\n`;
            toml += `titleSelector = "${config.titleSelector}"\n`;
            toml += `linkSelector = "${config.linkSelector}"\n`;
            
            if (config.contentSelector) {
                toml += `contentSelector = "${config.contentSelector}"\n`;
            }
        }
        
        toml += '\n';
    }
    
    return toml;
}

async function updateIndexHtml(feeds) {
    let indexHtml = fs.readFileSync('index.html', 'utf-8');
    
    // Generate feedNames object for native RSS feeds
    const nativeFeeds = feeds.filter(f => f.enabled && f.type === 'native_rss');
    
    if (nativeFeeds.length > 0) {
        let feedNamesCode = "const feedNames = {\n    'all': 'Combined Feed',\n";
        
        // Add scraped feeds
        const scrapedFeeds = feeds.filter(f => f.enabled && f.type === 'scraped');
        for (const feed of scrapedFeeds) {
            feedNamesCode += `    '${feed.id}': '${feed.title}',\n`;
        }
        
        // Add native RSS feeds
        for (const feed of nativeFeeds) {
            feedNamesCode += `    '${feed.id}': '${feed.title}',\n`;
        }
        
        feedNamesCode += "};\n\n";
        
        // Add native RSS URLs
        feedNamesCode += "const nativeRssFeeds = {\n";
        for (const feed of nativeFeeds) {
            feedNamesCode += `    '${feed.id}': '${USE_FIREBASE ? feed.rss_url : feed.rss_url}',\n`;
        }
        feedNamesCode += "};\n";
        
        // Replace in HTML
        const regex = /const feedNames = \{[\s\S]*?\};/;
        indexHtml = indexHtml.replace(regex, feedNamesCode.trim());
    }
    
    fs.writeFileSync('index.html', indexHtml);
}

async function main() {
    try {
        console.log('Fetching feed configuration...');
        
        const feeds = USE_FIREBASE ? await fetchFromFirebase() : await fetchFromSupabase();
        
        console.log(`Found ${feeds.length} feeds`);
        
        // Generate feeds.toml for scraped feeds
        const tomlContent = generateToml(feeds);
        fs.writeFileSync('feeds.toml', tomlContent);
        console.log('Generated feeds.toml');
        
        // Update index.html with native RSS feeds
        await updateIndexHtml(feeds);
        console.log('Updated index.html');
        
        console.log('Configuration fetch complete!');
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

main();
```

Create `package.json` in your repository:

```json
{
  "name": "rss-feed-generator",
  "version": "1.0.0",
  "description": "Automated RSS feed generator",
  "scripts": {
    "fetch-config": "node fetch-feeds-config.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  }
}
```

---

### Phase 4: Deployment & Testing (2-3 hours)

1. **Add Secrets to GitHub**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add secrets:
     - For Firebase:
       - `FIREBASE_API_KEY`
       - `FIREBASE_PROJECT_ID`
     - For Supabase:
       - `SUPABASE_URL`
       - `SUPABASE_KEY`

2. **Test the Admin Panel**
   ```bash
   # Commit and push admin.html
   git add admin.html package.json fetch-feeds-config.js
   git commit -m "Add admin panel and config fetcher"
   git push origin main
   ```

3. **Wait for GitHub Actions to Deploy**
   - Go to Actions tab
   - Watch the workflow run
   - Once complete, visit: `https://YOUR_USERNAME.github.io/YOUR_REPO/admin.html`

4. **Login and Add a Test Feed**
   - Login with your admin credentials
   - Add a simple feed (e.g., a blog with clear CSS selectors)
   - Wait for next scheduled run or trigger manually via Actions tab

5. **Verify Feed Generation**
   - Check that new feed appears on main site
   - Verify XML is generated correctly

---

### Phase 5: Migration of Existing Feeds (1-2 hours)

Create a one-time migration script `migrate-existing-feeds.js`:

```javascript
// Run this once to migrate feeds from feeds.toml to database
const fs = require('fs');
const axios = require('axios');

// Parse your existing feeds.toml manually
const existingFeeds = [
    {
        id: "funfacts",
        title: "Wikipedia — did you know?",
        type: "scraped",
        config: {
            url: "https://en.wikipedia.org/wiki/Wikipedia:Recent_additions",
            entrySelector: "#mw-content-text > div > ul > li",
            titleSelector: "a:first-of-type",
            linkSelector: "a:first-of-type",
            contentSelector: ""
        }
    },
    {
        id: "hackernews",
        title: "Hacker News - Front Page",
        type: "scraped",
        config: {
            url: ["https://news.ycombinator.com/", "https://news.ycombinator.com/?p=2"],
            entrySelector: ".athing",
            titleSelector: ".titleline > a",
            linkSelector: ".titleline > a",
            contentSelector: ".titleline > a"
        }
    },
    {
        id: "economymedia",
        title: "Economy Media YouTube",
        type: "native_rss",
        rss_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCc8q4B1bj-668LMHyNXnTxQ"
    }
    // Add more feeds...
];

// Upload to Firebase/Supabase using admin panel or API
console.log('Copy these feeds into your admin panel:');
console.log(JSON.stringify(existingFeeds, null, 2));
```

---

## Solution 2: Web UI with GitHub Integration (GitHub API)

### Architecture Overview

This solution uses the GitHub API to directly modify the `feeds.toml` file through a web interface.

```
┌─────────────────┐
│   Web Admin UI  │ (Add/Remove Feeds)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   GitHub API    │ (Commit to feeds.toml)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │ (Auto-triggered on commit)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Pages   │ (Serve Feeds + UI)
└─────────────────┘
```

### Prerequisites

- GitHub Personal Access Token (PAT) with `repo` permissions
- Current GitHub repository with Feed me up, Scotty setup
- Understanding of TOML format

---

### Phase 1: GitHub Token Setup (15 minutes)

1. **Create Personal Access Token**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name: "RSS Feed Admin"
   - Scopes: Select `repo` (full control of private repositories)
   - Click "Generate token"
   - **IMPORTANT**: Copy the token immediately (you won't see it again)

2. **Secure Token Storage Options**
   - **Option A**: Environment variable in admin page (less secure, easier)
   - **Option B**: Serverless function (Vercel/Netlify) to proxy GitHub API (more secure)
   - **Option C**: GitHub App (most secure, complex setup)

---

### Phase 2: Admin Interface with GitHub Integration (6-8 hours)

Create `admin-github.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSS Feed Admin (GitHub)</title>
    <style>
        /* Use same styles as Firebase admin.html */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'HandWide', sans-serif;
            background: #ffffff;
            color: #000000;
            padding: 40px 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            border-bottom: 3px solid #000000;
            padding-bottom: 10px;
        }

        .token-section {
            background: #fff3cd;
            padding: 30px;
            margin-bottom: 40px;
            border: 2px solid #ff9800;
        }

        .token-section input {
            width: 100%;
            padding: 12px;
            margin-top: 10px;
            border: 2px solid #000000;
            font-family: monospace;
            font-size: 0.9em;
        }

        .btn {
            padding: 12px 30px;
            background: #000000;
            color: #ffffff;
            border: none;
            cursor: pointer;
            font-family: 'HandWide', sans-serif;
            font-size: 1em;
            font-weight: 700;
            transition: all 0.2s ease;
            margin-top: 10px;
        }

        .btn:hover {
            background: #333333;
        }

        .btn-secondary {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
        }

        .btn-secondary:hover {
            background: #f5f5f5;
        }

        .btn-danger {
            background: #cc0000;
        }

        .btn-danger:hover {
            background: #990000;
        }

        .feed-list {
            margin-top: 40px;
        }

        .feed-item {
            background: #f5f5f5;
            padding: 25px;
            margin-bottom: 20px;
            border: 2px solid #000000;
        }

        .feed-item h3 {
            font-size: 1.5em;
            margin-bottom: 10px;
        }

        .feed-controls {
            margin-top: 15px;
        }

        .feed-controls button {
            margin-right: 10px;
            margin-bottom: 10px;
        }

        .add-feed-section {
            background: #e8e8e8;
            padding: 30px;
            margin-bottom: 40px;
            border: 3px solid #000000;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 1.1em;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #000000;
            font-family: 'HandWide', sans-serif;
            font-size: 1em;
        }

        .form-group textarea {
            min-height: 120px;
            font-family: monospace;
        }

        .hidden {
            display: none;
        }

        .alert {
            padding: 15px;
            margin-bottom: 20px;
            border: 2px solid #000000;
            font-weight: 700;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
        }

        .alert-warning {
            background: #fff3cd;
            color: #856404;
        }

        .toml-preview {
            background: #ffffff;
            padding: 15px;
            border: 2px solid #000000;
            font-family: monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
            margin-top: 20px;
        }

        .security-warning {
            background: #f8d7da;
            border: 2px solid #cc0000;
            padding: 20px;
            margin-bottom: 30px;
        }

        .security-warning h3 {
            color: #721c24;
            margin-bottom: 10px;
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .loading-content {
            background: white;
            padding: 40px;
            border: 3px solid #000000;
            font-size: 1.3em;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>RSS Feed Admin Panel (GitHub)</h1>

        <div class="security-warning">
            <h3>⚠️ Security Warning</h3>
            <p>This admin panel uses your GitHub Personal Access Token. Never share this page or your token with others. For production use, consider implementing a serverless backend to proxy GitHub API calls.</p>
        </div>

        <!-- Token Input Section -->
        <div id="token-section" class="token-section">
            <h2>GitHub Configuration</h2>
            <p>Enter your GitHub details to manage feeds:</p>
            
            <div class="form-group">
                <label for="github-token">Personal Access Token (needs 'repo' scope):</label>
                <input type="password" id="github-token" placeholder="ghp_..." />
            </div>

            <div class="form-group">
                <label for="repo-owner">Repository Owner (username or org):</label>
                <input type="text" id="repo-owner" placeholder="e.g., username" />
            </div>

            <div class="form-group">
                <label for="repo-name">Repository Name:</label>
                <input type="text" id="repo-name" placeholder="e.g., rss-feeds" />
            </div>

            <button class="btn" onclick="connectGitHub()">Connect to GitHub</button>
            <div id="token-message" style="margin-top: 15px;"></div>
        </div>

        <!-- Main Content (hidden until connected) -->
        <div id="main-content" class="hidden">
            <div style="margin-bottom: 30px;">
                <p>Connected to: <strong id="connected-repo"></strong></p>
                <button class="btn btn-secondary" onclick="disconnect()">Disconnect</button>
                <button class="btn" onclick="loadCurrentConfig()">Refresh</button>
            </div>

            <div id="alert-container"></div>

            <!-- Current TOML Preview -->
            <div style="margin-bottom: 40px;">
                <h2>Current Configuration</h2>
                <div id="toml-preview" class="toml-preview">Loading...</div>
            </div>

            <!-- Add New Feed Section -->
            <div class="add-feed-section">
                <h2>Add New Feed</h2>
                
                <div class="form-group">
                    <label for="feed-id">Feed ID (unique identifier, lowercase, no spaces):</label>
                    <input type="text" id="feed-id" placeholder="e.g., techcrunch" />
                </div>

                <div class="form-group">
                    <label for="feed-title">Display Title:</label>
                    <input type="text" id="feed-title" placeholder="e.g., TechCrunch News" />
                </div>

                <div class="form-group">
                    <label for="feed-url">Page URL(s) (one per line for multiple pages):</label>
                    <textarea id="feed-url" placeholder="https://example.com/news&#10;https://example.com/news?page=2"></textarea>
                </div>

                <div class="form-group">
                    <label for="entry-selector">Entry Selector (CSS):</label>
                    <input type="text" id="entry-selector" placeholder="e.g., .article, article.post" />
                </div>

                <div class="form-group">
                    <label for="title-selector">Title Selector (CSS):</label>
                    <input type="text" id="title-selector" placeholder="e.g., h2 a, .title" />
                </div>

                <div class="form-group">
                    <label for="link-selector">Link Selector (CSS):</label>
                    <input type="text" id="link-selector" placeholder="e.g., h2 a, a.permalink" />
                </div>

                <div class="form-group">
                    <label for="content-selector">Content Selector (CSS, optional):</label>
                    <input type="text" id="content-selector" placeholder="e.g., .excerpt, .summary" />
                </div>

                <button class="btn" onclick="addFeed()">Add Feed</button>
                <button class="btn btn-secondary" onclick="clearForm()">Clear Form</button>
            </div>

            <!-- Feed List Section -->
            <div class="feed-list">
                <h2>Current Feeds</h2>
                <div id="feed-list-container"></div>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div id="loading-overlay" class="loading-overlay hidden">
            <div class="loading-content">
                <p>⏳ Committing to GitHub...</p>
            </div>
        </div>
    </div>

    <script>
        // GitHub API Configuration
        let githubConfig = {
            token: '',
            owner: '',
            repo: '',
            branch: 'main',
            filePath: 'feeds.toml',
            currentSha: ''
        };

        let currentToml = '';
        let parsedFeeds = {};

        // Load saved config from localStorage
        function loadSavedConfig() {
            const saved = localStorage.getItem('github_config');
            if (saved) {
                const config = JSON.parse(saved);
                githubConfig = { ...githubConfig, ...config };
                document.getElementById('repo-owner').value = config.owner || '';
                document.getElementById('repo-name').value = config.repo || '';
                
                if (config.token) {
                    // Auto-connect if we have saved credentials
                    document.getElementById('github-token').value = config.token;
                }
            }
        }

        // Save config to localStorage
        function saveConfig() {
            localStorage.setItem('github_config', JSON.stringify({
                token: githubConfig.token,
                owner: githubConfig.owner,
                repo: githubConfig.repo
            }));
        }

        async function connectGitHub() {
            const token = document.getElementById('github-token').value.trim();
            const owner = document.getElementById('repo-owner').value.trim();
            const repo = document.getElementById('repo-name').value.trim();

            if (!token || !owner || !repo) {
                showAlert('All fields are required!', 'error');
                return;
            }

            githubConfig.token = token;
            githubConfig.owner = owner;
            githubConfig.repo = repo;

            try {
                showLoading(true);
                await loadCurrentConfig();
                
                saveConfig();
                
                document.getElementById('token-section').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                document.getElementById('connected-repo').textContent = `${owner}/${repo}`;
                
                showAlert('Connected to GitHub successfully!', 'success');
            } catch (error) {
                showAlert('Failed to connect: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        function disconnect() {
            localStorage.removeItem('github_config');
            location.reload();
        }

        async function loadCurrentConfig() {
            const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.filePath}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            githubConfig.currentSha = data.sha;
            
            // Decode base64 content
            currentToml = atob(data.content);
            
            // Display TOML
            document.getElementById('toml-preview').textContent = currentToml;
            
            // Parse TOML into feeds
            parseTomlFeeds(currentToml);
            displayFeedList();
        }

        function parseTomlFeeds(toml) {
            parsedFeeds = {};
            
            // Simple TOML parser for our specific structure
            const lines = toml.split('\n');
            let currentFeed = null;
            
            for (let line of lines) {
                line = line.trim();
                
                // Skip comments and empty lines
                if (!line || line.startsWith('#')) continue;
                
                // New feed section
                const sectionMatch = line.match(/^\[(.+)\]$/);
                if (sectionMatch) {
                    currentFeed = sectionMatch[1];
                    parsedFeeds[currentFeed] = {};
                    continue;
                }
                
                // Property line
                const propMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
                if (propMatch && currentFeed) {
                    const key = propMatch[1];
                    let value = propMatch[2].trim();
                    
                    // Remove quotes
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    
                    // Handle arrays
                    if (value.startsWith('[')) {
                        value = value.slice(1, -1)
                            .split(',')
                            .map(v => v.trim().replace(/"/g, ''));
                    }
                    
                    parsedFeeds[currentFeed][key] = value;
                }
            }
        }

        function displayFeedList() {
            const container = document.getElementById('feed-list-container');
            
            if (Object.keys(parsedFeeds).length === 0) {
                container.innerHTML = '<p>No feeds configured yet.</p>';
                return;
            }

            let html = '';
            for (const [feedId, config] of Object.entries(parsedFeeds)) {
                html += `
                    <div class="feed-item">
                        <h3>${config.title || feedId}</h3>
                        <p><strong>ID:</strong> ${feedId}</p>
                        <p><strong>URL:</strong> ${Array.isArray(config.url) ? config.url.join(', ') : config.url}</p>
                        <p><strong>Entry Selector:</strong> ${config.entrySelector}</p>
                        <div class="feed-controls">
                            <button class="btn btn-danger" onclick="deleteFeed('${feedId}')">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        }

        function generateTomlFromFeeds() {
            let toml = '# RSS Feed Configuration\n# Managed via admin panel\n\n';
            
            for (const [feedId, config] of Object.entries(parsedFeeds)) {
                toml += `[${feedId}]\n`;
                
                for (const [key, value] of Object.entries(config)) {
                    if (Array.isArray(value)) {
                        toml += `${key} = [${value.map(v => `"${v}"`).join(', ')}]\n`;
                    } else {
                        toml += `${key} = "${value}"\n`;
                    }
                }
                
                toml += '\n';
            }
            
            return toml;
        }

        async function commitToGitHub(newContent, message) {
            const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.filePath}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    content: btoa(unescape(encodeURIComponent(newContent))), // Base64 encode with UTF-8 support
                    sha: githubConfig.currentSha,
                    branch: githubConfig.branch
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            githubConfig.currentSha = data.content.sha;
            
            return data;
        }

        async function addFeed() {
            const feedId = document.getElementById('feed-id').value.trim();
            const feedTitle = document.getElementById('feed-title').value.trim();
            const urlText = document.getElementById('feed-url').value.trim();
            const urls = urlText.split('\n').map(u => u.trim()).filter(u => u);

            if (!feedId || !feedTitle || urls.length === 0) {
                showAlert('Feed ID, Title, and at least one URL are required!', 'error');
                return;
            }

            const entrySelector = document.getElementById('entry-selector').value.trim();
            const titleSelector = document.getElementById('title-selector').value.trim();
            const linkSelector = document.getElementById('link-selector').value.trim();
            const contentSelector = document.getElementById('content-selector').value.trim();

            if (!entrySelector || !titleSelector || !linkSelector) {
                showAlert('All selectors (except content) are required!', 'error');
                return;
            }

            if (parsedFeeds[feedId]) {
                showAlert('A feed with this ID already exists!', 'error');
                return;
            }

            // Add to parsed feeds
            parsedFeeds[feedId] = {
                title: feedTitle,
                url: urls.length === 1 ? urls[0] : urls,
                entrySelector: entrySelector,
                titleSelector: titleSelector,
                linkSelector: linkSelector
            };

            if (contentSelector) {
                parsedFeeds[feedId].contentSelector = contentSelector;
            }

            // Generate new TOML
            const newToml = generateTomlFromFeeds();

            try {
                showLoading(true);
                await commitToGitHub(newToml, `Add feed: ${feedTitle}`);
                
                currentToml = newToml;
                document.getElementById('toml-preview').textContent = newToml;
                displayFeedList();
                clearForm();
                
                showAlert(`Feed "${feedTitle}" added successfully! GitHub Actions will generate it shortly.`, 'success');
            } catch (error) {
                // Rollback
                delete parsedFeeds[feedId];
                showAlert('Error committing to GitHub: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        async function deleteFeed(feedId) {
            if (!confirm(`Are you sure you want to delete the feed "${parsedFeeds[feedId].title}"? This action cannot be undone.`)) {
                return;
            }

            const backup = { ...parsedFeeds[feedId] };
            delete parsedFeeds[feedId];

            // Generate new TOML
            const newToml = generateTomlFromFeeds();

            try {
                showLoading(true);
                await commitToGitHub(newToml, `Delete feed: ${backup.title}`);
                
                currentToml = newToml;
                document.getElementById('toml-preview').textContent = newToml;
                displayFeedList();
                
                showAlert(`Feed "${backup.title}" deleted successfully!`, 'success');
            } catch (error) {
                // Rollback
                parsedFeeds[feedId] = backup;
                showAlert('Error committing to GitHub: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        function clearForm() {
            document.getElementById('feed-id').value = '';
            document.getElementById('feed-title').value = '';
            document.getElementById('feed-url').value = '';
            document.getElementById('entry-selector').value = '';
            document.getElementById('title-selector').value = '';
            document.getElementById('link-selector').value = '';
            document.getElementById('content-selector').value = '';
        }

        function showAlert(message, type) {
            const container = document.getElementById('alert-container');
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.textContent = message;
            container.appendChild(alertDiv);

            setTimeout(() => {
                alertDiv.remove();
            }, 7000);
        }

        function showLoading(show) {
            const overlay = document.getElementById('loading-overlay');
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }

        // Initialize
        loadSavedConfig();
    </script>
</body>
</html>
```

---

### Phase 3: Update GitHub Actions (15 minutes)

Update `.github/workflows/generate-feeds.yml` to copy the admin page:

```yaml
      - name: Copy HTML files to public folder
        run: |
          cp index.html public/index.html
          cp admin-github.html public/admin.html
```

---

### Phase 4: Deployment & Testing (1-2 hours)

1. **Commit and Push**
   ```bash
   git add admin-github.html
   git commit -m "Add GitHub-based admin panel"
   git push origin main
   ```

2. **Create Personal Access Token**
   - Follow Phase 1 instructions
   - Keep token secure

3. **Test Admin Panel**
   - Visit: `https://YOUR_USERNAME.github.io/YOUR_REPO/admin.html`
   - Enter your token, owner, and repo name
   - Connect to GitHub
   - Verify current feeds load

4. **Add Test Feed**
   - Add a simple feed
   - Check GitHub commits (should see new commit)
   - Wait for Actions to complete
   - Verify feed appears on main site

---

## Comparison: Firebase/Supabase vs GitHub API

| Feature | Firebase/Supabase | GitHub API |
|---------|-------------------|------------|
| **Setup Complexity** | Medium (requires external service) | Low (uses existing GitHub) |
| **Security** | High (proper auth, RLS) | Medium (requires PAT management) |
| **Feed Storage** | Database (structured) | TOML file (text-based) |
| **Version Control** | Manual commit creation | Automatic via GitHub |
| **Scalability** | Excellent | Good (rate limits apply) |
| **Cost** | Free tier limits | Free for public repos |
| **Query Capabilities** | Advanced (SQL/NoSQL) | Limited (file parsing) |
| **Native RSS Support** | Flexible | Possible but complex |
| **Collaboration** | Easy (multiple admins) | Tricky (PAT sharing issues) |
| **Audit Trail** | Database logs | Git history |
| **Offline Editing** | No | Possible (edit TOML locally) |

---

## Post-Migration Checklist

### For Both Solutions

- [ ] Backup current `feeds.toml` file
- [ ] Test admin panel in private/incognito window
- [ ] Verify all existing feeds work after migration
- [ ] Document admin login credentials securely
- [ ] Set up monitoring for failed feed generations
- [ ] Create user documentation for adding new feeds
- [ ] Test feed addition/deletion workflow end-to-end
- [ ] Verify GitHub Actions still run on schedule
- [ ] Test manual trigger of GitHub Actions
- [ ] Check mobile responsiveness of admin panel

### Firebase/Supabase Specific

- [ ] Enable Firestore/Supabase backups
- [ ] Set up admin user accounts
- [ ] Configure security rules properly
- [ ] Test authentication flow
- [ ] Verify API keys are in GitHub Secrets
- [ ] Monitor database usage (free tier limits)

### GitHub API Specific

- [ ] Store PAT securely (password manager)
- [ ] Test rate limit handling
- [ ] Verify commit messages are meaningful
- [ ] Check git history for proper attribution
- [ ] Consider implementing serverless proxy for production

---

## Future Enhancements

### Short Term (1-2 weeks)
- Feed preview before adding
- Bulk feed import from OPML
- Feed analytics (view counts, errors)
- Email notifications on feed failures
- Search/filter feeds in admin panel

### Medium Term (1-2 months)
- Feed categories/tags
- Custom CSS for individual feeds
- Feed scheduling (different update frequencies)
- A/B testing for selectors
- Feed health monitoring dashboard

### Long Term (3-6 months)
- Multi-user collaboration with roles
- Feed templates library
- AI-assisted selector detection
- Browser extension for easy feed addition
- Webhook notifications for new items
- RSS reader integration APIs

---

## Troubleshooting Guide

### Common Issues

#### Firebase/Supabase
**Issue**: "Permission denied" when adding feeds  
**Solution**: Check Firestore security rules, verify user is authenticated with admin claim

**Issue**: "Failed to fetch" in admin panel  
**Solution**: Verify Firebase config is correct, check browser console for CORS errors

**Issue**: Feeds not generating after adding  
**Solution**: Check GitHub Actions logs, verify secrets are set correctly

#### GitHub API
**Issue**: "401 Unauthorized" when connecting  
**Solution**: Verify PAT has correct scopes, check if token is expired

**Issue**: "409 Conflict" when committing  
**Solution**: SHA mismatch - click "Refresh" to reload current config

**Issue**: Rate limit exceeded  
**Solution**: Wait for rate limit reset (1 hour), consider caching config locally

### Getting Help

- Check GitHub Actions logs for feed generation errors
- Review browser console for JavaScript errors
- Test feed selectors manually using browser DevTools
- Verify TOML syntax using online validators
- Consult Feed me up, Scotty documentation: https://feed-me-up-scotty.vincenttunru.com/

---

## Conclusion

Both solutions provide scalable ways to manage RSS feeds through a web interface:

- **Choose Firebase/Supabase** if you need advanced features, multiple admins, and robust security
- **Choose GitHub API** if you prefer simplicity, want to leverage existing GitHub infrastructure, and are comfortable with PAT management

Start with the GitHub API approach for quick implementation, then migrate to Firebase/Supabase if you need more advanced features later.

The migration can be completed in 1-2 days for basic functionality, with additional time for testing and refinement.

---

## Support & Maintenance

### Regular Tasks
- Monitor GitHub Actions for failures (weekly)
- Review and update feed selectors as websites change (monthly)
- Check database/API usage against free tier limits (monthly)
- Backup feed configurations (monthly)
- Update dependencies and security patches (quarterly)

### Resources
- GitHub Actions Documentation: https://docs.github.com/en/actions
- Firebase Documentation: https://firebase.google.com/docs
- Supabase Documentation: https://supabase.com/docs
- Feed me up, Scotty: https://feed-me-up-scotty.vincenttunru.com/

---

*Last Updated: October 20, 2025*

