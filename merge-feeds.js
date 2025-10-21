#!/usr/bin/env node

/**
 * Merge individual RSS feeds into a combined feed with proper links
 */

const fs = require('fs');
const path = require('path');

const FEEDS = [
  'funfacts.xml',
  'wikivoyage.xml',
  'hackernews.xml',
  'medium_matteo.xml'
];

const PUBLIC_DIR = './public';

// Read all individual feeds
const entries = [];

FEEDS.forEach(feedFile => {
  const feedPath = path.join(PUBLIC_DIR, feedFile);
  
  if (!fs.existsSync(feedPath)) {
    console.warn(`Warning: ${feedFile} not found, skipping...`);
    return;
  }
  
  const feedContent = fs.readFileSync(feedPath, 'utf-8');
  
  // Extract entries from the feed
  const entryMatches = feedContent.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  
  for (const match of entryMatches) {
    const entryXml = match[1];
    
    // Extract key fields
    const titleMatch = entryXml.match(/<title(?:[^>]*)>(.*?)<\/title>/);
    const linkMatch = entryXml.match(/<link[^>]*href=["'](.*?)["'][^>]*\/>/);
    const contentMatch = entryXml.match(/<content(?:[^>]*)>([\s\S]*?)<\/content>/);
    const summaryMatch = entryXml.match(/<summary(?:[^>]*)>([\s\S]*?)<\/summary>/);
    const updatedMatch = entryXml.match(/<updated>(.*?)<\/updated>/);
    const publishedMatch = entryXml.match(/<published>(.*?)<\/published>/);
    const idMatch = entryXml.match(/<id>(.*?)<\/id>/);
    
    if (titleMatch && linkMatch) {
      const title = titleMatch[1];
      const link = linkMatch[1];
      const content = contentMatch ? contentMatch[1] : (summaryMatch ? summaryMatch[1] : '');
      const updated = updatedMatch ? updatedMatch[1] : (publishedMatch ? publishedMatch[1] : new Date().toISOString());
      const id = idMatch ? idMatch[1] : link;
      
      entries.push({
        title,
        link,
        content,
        updated,
        id,
        xml: match[0] // Store the full entry XML
      });
    }
  }
});

// Sort by date (newest first)
entries.sort((a, b) => new Date(b.updated) - new Date(a.updated));

// Generate combined feed
const now = new Date().toISOString();
const combinedFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Combined Feed - All Sources</title>
  <link href="https://arbnorcyberlabs-eng.github.io/rss-feeds/all.xml" rel="self"/>
  <link href="https://arbnorcyberlabs-eng.github.io/rss-feeds/"/>
  <updated>${now}</updated>
  <id>https://arbnorcyberlabs-eng.github.io/rss-feeds/all.xml</id>
  <author>
    <name>RSS Feed Aggregator</name>
  </author>
  ${entries.map(entry => entry.xml).join('\n  ')}
</feed>`;

// Write combined feed
const outputPath = path.join(PUBLIC_DIR, 'all.xml');
fs.writeFileSync(outputPath, combinedFeed, 'utf-8');

console.log(`✓ Generated combined feed with ${entries.length} entries`);
console.log(`✓ Saved to ${outputPath}`);

