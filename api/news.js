import { FEEDS, CATEGORIES, REROUTE } from "../lib/feeds.js";
import { parseFeed, ogImage } from "../lib/rss.js";

const UA = "Mozilla/5.0 (compatible; ArulTechFeed/1.0; +https://vercel.com)";
const MAX_AGE_H = 72;       // ignore stories older than this
const PER_CAT = 12;         // stories kept per category
const OG_LOOKUPS = 60;      // max article pages fetched for thumbnails per refresh

async function get(url, ms = 6000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "*/*" }, signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.text();
  } finally { clearTimeout(t); }
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k]); } }));
}

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").slice(0, 80);

async function collect() {
  const results = await Promise.allSettled(FEEDS.map(async (f) => parseFeed(await get(f.url), f.cat, f.url)));
  const failed = FEEDS.filter((_, i) => results[i].status === "rejected").map((f) => f.url);
  const cutoff = Date.now() - MAX_AGE_H * 3600e3;
  const seen = new Set();
  let all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((s) => !s.publishedAt || Date.parse(s.publishedAt) > cutoff)
    .filter((s) => { const k = norm(s.title); if (seen.has(k)) return false; seen.add(k); return true; });

  for (const s of all) for (const r of REROUTE) if (r.from.includes(s.cat) && r.test.test(s.title + " " + s.summary)) { s.cat = r.to; break; }

  all.sort((a, b) => (Date.parse(b.publishedAt || 0) || 0) - (Date.parse(a.publishedAt || 0) || 0));
  const byCat = {};
  all = all.filter((s) => ((byCat[s.cat] = (byCat[s.cat] || 0) + 1) <= PER_CAT));

  // Thumbnails: use the article's og:image when the feed had none.
  const missing = all.filter((s) => !s.image && !/news\.google\.com/.test(s.url)).slice(0, OG_LOOKUPS);
  await pool(missing, 10, async (s) => { try { s.image = ogImage((await get(s.url, 3500)).slice(0, 200000)); } catch {} });
  for (const s of all) if (s.image && s.image.startsWith("//")) s.image = "https:" + s.image;

  return { all, failed };
}

// Optional: let Claude pick the top stories and write one-line summaries.
async function curate(stories) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !stories.length) return { curated: false };
  const list = stories.map((s, i) => `${i}\t[${s.cat}] ${s.title} — ${s.source}${s.summary ? " :: " + s.summary.slice(0, 160) : ""}`).join("\n");
  const prompt = `You are the editor of a daily tech briefing for an Indian tech professional interested in AI, cloud, gadgets, startups, SEO, AEO/GEO, e-commerce and Shopify.
Here are today's candidate stories (index, category, title, source, snippet):
${list}

Return ONLY JSON: {"featured":[5 indexes of the most important stories, mixed categories, most important first],"rank":[up to 40 indexes in overall importance order],"summaries":{"<index>":"one plain factual sentence, max 25 words"}} — write summaries for every index in "rank". Do not invent facts beyond the title and snippet.`;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Claude API ${r.status}`);
  const j = await r.json();
  const text = (j.content || []).map((c) => c.text || "").join("");
  const out = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  (out.rank || []).forEach((i, n) => { if (stories[i]) stories[i].rank = n + 1; });
  (out.featured || []).forEach((i) => { if (stories[i]) stories[i].featured = true; });
  for (const [i, t] of Object.entries(out.summaries || {})) if (stories[i] && t) stories[i].summary = String(t);
  return { curated: true };
}

export default async function handler(req, res) {
  try {
    const { all, failed } = await collect();
    let curated = false;
    try { ({ curated } = await curate(all)); } catch (e) { console.error("curation skipped:", e.message); }
    if (!curated) {
      // Without Claude: newest story with an image from each of the first five categories is featured.
      const used = new Set();
      for (const s of all) if (s.image && !used.has(s.cat) && used.size < 5) { s.featured = true; used.add(s.cat); }
    }
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=7200");
    res.status(200).json({ updatedAt: new Date().toISOString(), curated, categories: CATEGORIES, failedFeeds: failed, stories: all });
  } catch (e) {
    res.status(500).json({ error: "Could not build the feed", detail: String(e.message || e) });
  }
}
