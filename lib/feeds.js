// Feed sources per category. Edit freely: add or remove URLs, change Google News queries.
const gnews = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=en-IN&gl=IN&ceid=IN:en`;

export const CATEGORIES = {
  ai:        { label: "AI & ML" },
  cloud:     { label: "Cloud & DevOps" },
  gadgets:   { label: "Gadgets & Mobile" },
  startups:  { label: "Startups & Business" },
  seo:       { label: "SEO" },
  aeo:       { label: "AEO & GEO" },
  ecommerce: { label: "E-commerce" },
  shopify:   { label: "Shopify" },
};

export const FEEDS = [
  // AI & ML
  { cat: "ai", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { cat: "ai", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { cat: "ai", url: "https://venturebeat.com/category/ai/feed/" },
  // Cloud & DevOps
  { cat: "cloud", url: "https://www.cloudcomputing-news.net/feed/" },
  { cat: "cloud", url: "https://aws.amazon.com/blogs/aws/feed/" },
  { cat: "cloud", url: "https://cloudblog.withgoogle.com/rss/" },
  { cat: "cloud", url: "https://www.infoq.com/devops/news/rss/" },
  // Gadgets & Mobile
  { cat: "gadgets", url: "https://www.gsmarena.com/rss-news-reviews.php3" },
  { cat: "gadgets", url: "https://www.gizmochina.com/feed/" },
  { cat: "gadgets", url: "https://www.theverge.com/rss/tech/index.xml" },
  // Startups & Business
  { cat: "startups", url: "https://inc42.com/feed/" },
  { cat: "startups", url: "https://techcrunch.com/category/startups/feed/" },
  { cat: "startups", url: "https://yourstory.com/feed" },
  // SEO (AI-search stories are moved to AEO & GEO automatically)
  { cat: "seo", url: "https://searchengineland.com/feed" },
  { cat: "seo", url: "https://www.searchenginejournal.com/feed/" },
  { cat: "seo", url: "https://www.seroundtable.com/index.xml" },
  // AEO & GEO
  { cat: "aeo", url: gnews('"generative engine optimization" OR "answer engine optimization" OR "AI Overviews" OR "AI Mode" SEO') },
  // E-commerce
  { cat: "ecommerce", url: "https://www.practicalecommerce.com/feed" },
  { cat: "ecommerce", url: "https://www.digitalcommerce360.com/feed/" },
  { cat: "ecommerce", url: "https://www.modernretail.co/feed/" },
  { cat: "ecommerce", url: gnews("ecommerce India") },
  // Shopify
  { cat: "shopify", url: "https://shopify.dev/changelog/feed.xml" },
  { cat: "shopify", url: gnews("Shopify") },
];

// Re-route stories by keyword after parsing.
export const REROUTE = [
  { to: "aeo", from: ["seo", "ai"], test: /\b(AI Overviews?|AI Mode|answer engine|generative engine|GEO|AEO|LLM (?:visibility|citations?)|ChatGPT search|Perplexity|AI search|AI citations?)\b/i },
  { to: "shopify", from: ["ecommerce", "startups", "seo", "ai"], test: /\bShopify\b/i },
];
