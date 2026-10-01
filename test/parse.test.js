import assert from "node:assert";
import { parseFeed, ogImage } from "../lib/rss.js";
const rss = `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel>
<item><title><![CDATA[Google rolls out AI Mode &amp; more]]></title><link>https://searchengineland.com/a</link>
<pubDate>${new Date().toUTCString()}</pubDate><description><![CDATA[<p>Big <b>news</b> here.</p>]]></description>
<media:content url="https://img.example/a.jpg" medium="image"/></item>
<item><title>Shopify Editions Winter - The Verge</title><link>https://news.google.com/rss/articles/x</link><pubDate>${new Date().toUTCString()}</pubDate><source url="https://theverge.com">The Verge</source></item>
</channel></rss>`;
const a = parseFeed(rss, "seo", "https://searchengineland.com/feed");
assert.equal(a[0].title, "Google rolls out AI Mode & more");
assert.equal(a[0].image, "https://img.example/a.jpg");
assert.equal(a[0].summary, "Big news here.");
assert.equal(a[0].source, "Search Engine Land");
const g = parseFeed(rss, "shopify", "https://news.google.com/rss/search?q=x");
assert.equal(g[1].title, "Shopify Editions Winter"); assert.equal(g[1].source, "The Verge");
const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Pixel 11 review</title><link rel="alternate" href="https://www.theverge.com/p"/><published>2026-10-01T01:00:00Z</published><content type="html">&lt;img src="https://img.example/p.jpg"&gt; text</content></entry></feed>`;
const t = parseFeed(atom, "gadgets", "https://www.theverge.com/rss/tech/index.xml");
assert.equal(t[0].url, "https://www.theverge.com/p"); assert.equal(t[0].image, "https://img.example/p.jpg");
assert.equal(ogImage(`<meta property="og:image" content="https://x/y.png?a=1&amp;b=2">`), "https://x/y.png?a=1&b=2");

// handler with mocked network
globalThis.fetch = async (url) => ({ ok: true, status: 200, text: async () => (String(url).includes("feed") || String(url).includes("rss") || String(url).includes("xml") || String(url).includes("php3")) ? rss : `<meta property="og:image" content="https://img.example/og.jpg">` });
const { default: handler } = await import("../api/news.js");
let out; const res = { setHeader(){}, status(c){ this.c=c; return this; }, json(j){ out=j; } };
await handler({}, res);
assert.equal(res.c, 200);
const cats = new Set(out.stories.map(s=>s.cat));
assert.ok(cats.has("aeo"), "AI Mode story rerouted to aeo");
assert.ok(cats.has("shopify"));
assert.ok(out.stories.some(s=>s.featured));
console.log("all tests passed:", out.stories.length, "stories", [...cats].join(","));
