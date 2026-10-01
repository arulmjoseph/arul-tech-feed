// Tiny dependency-free RSS 2.0 / Atom parser, good enough for news feeds.
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decode(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
export function stripHtml(s = "") {
  return decode(decode(s)).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : "";
}
function attr(block, tagName, attrName, filter) {
  const re = new RegExp(`<${tagName}\\b([^>]*)/?>`, "gi");
  let m;
  while ((m = re.exec(block))) {
    if (filter && !filter.test(m[1])) continue;
    const a = m[1].match(new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, "i"));
    if (a) return decode(a[1]);
  }
  return "";
}
function findImage(block) {
  return (
    attr(block, "media:content", "url", /medium=["']image|type=["']image|\.(jpe?g|png|webp)/i) ||
    attr(block, "media:thumbnail", "url") ||
    attr(block, "enclosure", "url", /type=["']image/i) ||
    attr(block, "media:content", "url") ||
    (decode(tag(block, "content:encoded") + tag(block, "description") + tag(block, "content")).match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] ||
    ""
  );
}
function hostName(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
}
const PRETTY = {
  "techcrunch.com": "TechCrunch", "theverge.com": "The Verge", "venturebeat.com": "VentureBeat",
  "cloudcomputing-news.net": "Cloud Computing News", "aws.amazon.com": "AWS News Blog",
  "cloudblog.withgoogle.com": "Google Cloud Blog", "cloud.google.com": "Google Cloud Blog", "infoq.com": "InfoQ",
  "gsmarena.com": "GSMArena", "gizmochina.com": "Gizmochina", "inc42.com": "Inc42", "yourstory.com": "YourStory",
  "searchengineland.com": "Search Engine Land", "searchenginejournal.com": "Search Engine Journal",
  "seroundtable.com": "Search Engine Roundtable", "practicalecommerce.com": "Practical Ecommerce",
  "digitalcommerce360.com": "Digital Commerce 360", "modernretail.co": "Modern Retail", "shopify.dev": "Shopify Developers",
};

export function parseFeed(xml, cat, feedUrl) {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
  return blocks.map((b) => {
    let title = stripHtml(tag(b, "title"));
    let link = isAtom
      ? attr(b, "link", "href", /rel=["']alternate|^(?![\s\S]*rel=)/i) || attr(b, "link", "href")
      : stripHtml(tag(b, "link")) || stripHtml(tag(b, "guid"));
    const date = stripHtml(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
    let source = stripHtml(tag(b, "source")) || PRETTY[hostName(feedUrl)] || hostName(feedUrl);
    // Google News titles end with " - Publisher"
    if (/news\.google\.com/.test(feedUrl)) {
      const m = title.match(/^(.*)\s+-\s+([^-]+)$/);
      if (m) { title = m[1]; source = m[2].trim(); }
    }
    let summary = stripHtml(tag(b, "description") || tag(b, "summary") || tag(b, "content"));
    if (/news\.google\.com/.test(feedUrl)) summary = "";
    if (summary.length > 220) summary = summary.slice(0, 217).replace(/\s+\S*$/, "") + "…";
    const d = new Date(date);
    return {
      cat, title, url: link, source, summary,
      image: findImage(b),
      publishedAt: isNaN(d) ? null : d.toISOString(),
    };
  }).filter((s) => s.title && /^https?:\/\//.test(s.url));
}

export function ogImage(html) {
  const m =
    html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::src)?["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)/i);
  return m ? decode(m[1]) : "";
}
