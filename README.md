# Arul's Tech Feed

An MSN-style daily tech news feed with real article thumbnails, deployed on Vercel.

Categories: AI & ML · Cloud & DevOps · Gadgets & Mobile · Startups & Business · SEO · AEO & GEO · E-commerce · Shopify

Every card opens the original article in a new tab.

## How it works

- `index.html` + `app.js` — the front end (no build step).
- `api/news.js` — a Vercel serverless function that pulls ~23 RSS feeds, removes duplicates, sorts stories into categories, and finds a thumbnail for each one (from the feed, or the article's `og:image`). Vercel's CDN caches the result for 30 minutes.
- `lib/feeds.js` — **edit this to add or remove sources and categories.**
- Optional Claude curation: add `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables. Claude then picks the top 5 stories and writes a one-line summary for each. Optional `ANTHROPIC_MODEL` overrides the default model (`claude-haiku-4-5`).

## Deploy

1. Go to https://vercel.com/new and import this GitHub repo.
2. Framework preset: **Other**. No build command, no output directory.
3. Click **Deploy**. Every push to `main` redeploys.

## Test locally

```bash
npm test          # parser + API tests (no network)
npx vercel dev    # run the site locally
```
