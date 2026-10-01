const CATS = {
  ai:        { label: "AI & ML",             glyph: "AI" },
  cloud:     { label: "Cloud & DevOps",      glyph: "☁" },
  gadgets:   { label: "Gadgets & Mobile",    glyph: "◎" },
  startups:  { label: "Startups & Business", glyph: "₹" },
  seo:       { label: "SEO",                 glyph: "S" },
  aeo:       { label: "AEO & GEO",           glyph: "G" },
  ecommerce: { label: "E-commerce",          glyph: "🛒" },
  shopify:   { label: "Shopify",             glyph: "S" },
};
let stories = [], updatedAt = null, filter = "all", heroIdx = 0;
try { filter = localStorage.getItem("tf-filter") || "all"; } catch (e) {}
if (filter !== "all" && !CATS[filter]) filter = "all";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");
const cvar = (k) => `var(--${CATS[k] ? k : "ai"})`;
const initials = (s) => (s || "?").replace(/^The\s+/i, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const hash = (s) => { let h = 0; for (const ch of s || "") h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
function ago(iso) {
  if (!iso) return "";
  const d = new Date(iso); if (isNaN(d)) return "";
  const m = Math.round((Date.now() - d) / 60000);
  if (m < 60) return Math.max(m, 1) + "m";
  if (m < 1440) return Math.round(m / 60) + "h";
  const days = Math.round(m / 1440);
  return days < 7 ? days + "d" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
const coverStyle = (s) => { const h = hash(s.title); return `--c:${cvar(s.cat)};--x:${40 + (h % 55)}%;--y:${10 + ((h >> 3) % 50)}%;--a:${(h >> 5) % 180}deg`; };
const img = (s, cls = "thumb") => s.image ? `<img class="${cls}" src="${esc(safeUrl(s.image))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.cover')?.classList.remove('has-img');this.remove()">` : "";
const link = (s) => `href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer"`;
const srcRow = (s) => `<div class="src" style="--c:${cvar(s.cat)}"><span class="mono">${esc(initials(s.source))}</span><b>${esc(s.source)}</b><span>· ${esc(ago(s.publishedAt))}</span><span class="ext" aria-hidden="true">↗</span></div>`;
const card = (s) => {
  const cat = CATS[s.cat] || CATS.ai;
  return `<a class="card" ${link(s)}>
    <div class="cover ${s.image ? "has-img" : ""}" style="${coverStyle(s)}"><span class="glyph">${esc(cat.glyph)}</span>${img(s)}</div>
    <div class="body"><span class="tag" style="--c:${cvar(s.cat)}">${esc(cat.label)}</span>
    <h4>${esc(s.title)}</h4>${s.summary ? `<p>${esc(s.summary)}</p>` : ""}${srcRow(s)}</div></a>`;
};

function renderChips() {
  const opts = [["all", "All"], ...Object.entries(CATS).map(([k, v]) => [k, v.label])];
  $("#chips").innerHTML = opts.map(([k, l]) =>
    `<button class="chip" type="button" data-k="${k}" aria-pressed="${filter === k}" ${k !== "all" ? `style="--c:var(--${k})"` : ""}>${k !== "all" ? '<span class="dot"></span>' : ""}${esc(l)}</button>`).join("");
}
$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  filter = b.dataset.k; heroIdx = 0;
  try { localStorage.setItem("tf-filter", filter); } catch (e) {}
  renderChips(); render();
});

function render() {
  const all = stories.slice().sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0));
  const list = filter === "all" ? all : all.filter((s) => s.cat === filter);
  const upd = updatedAt ? new Date(updatedAt) : null;
  $("#updated").textContent = `${all.length} stories · updated ${upd ? upd.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}`;
  if (!list.length) { $("#feed").innerHTML = `<div class="panel empty"><h2>No stories in this category right now</h2><div>Pick another category above or refresh in a little while.</div></div>`; return; }

  const pref = list.filter((s) => s.featured && s.image).concat(list.filter((s) => s.featured && !s.image), list.filter((s) => !s.featured && s.image), list.filter((s) => !s.featured && !s.image));
  const featured = pref.slice(0, Math.min(5, list.length));
  heroIdx = ((heroIdx % featured.length) + featured.length) % featured.length;
  const hero = featured[heroIdx];
  const rest = list.filter((s) => s !== hero);
  const top = rest.slice(0, 5), side = rest.slice(5, 7);
  const used = new Set([hero, ...top, ...side]);
  const heroCat = CATS[hero.cat] || CATS.ai;

  let html = `<section class="grid">
    <div class="panel"><h2>Top stories</h2><div class="toplist">${top.map((s) => `<a class="${s.image ? "withimg" : ""}" ${link(s)}><span><span class="t">${esc(s.title)}</span>${srcRow(s)}</span>${img(s, "mini")}</a>`).join("")}</div></div>
    <div class="hero-col"><article class="hero cover ${hero.image ? "has-img" : ""}" style="${coverStyle(hero)}">
      <span class="glyph">${esc(heroCat.glyph)}</span>${img(hero)}<div class="scrim"></div>
      <a class="hero-link" ${link(hero)} aria-label="${esc(hero.title)}"></a>
      <div class="kick"><span class="mono">${esc(initials(hero.source))}</span>${esc(hero.source)} · ${esc(heroCat.label)} · ${esc(ago(hero.publishedAt))}</div>
      <h3>${esc(hero.title)}</h3>${hero.summary ? `<p>${esc(hero.summary)}</p>` : ""}
      <div class="dots">${featured.map((_, i) => `<span class="${i === heroIdx ? "on" : ""}"></span>`).join("")}</div>
      <div class="hero-ctl"><button id="prev" type="button" aria-label="Previous story">‹</button><button id="next" type="button" aria-label="Next story">›</button></div>
    </article></div>
    <div class="stack">${side.map(card).join("")}</div>
  </section>`;

  const groups = filter === "all" ? Object.keys(CATS) : [filter];
  for (const k of groups) {
    const items = filter === "all" ? all.filter((s) => s.cat === k && s !== hero) : list.filter((s) => !used.has(s));
    if (!items.length) continue;
    html += `<section class="section" style="--c:${cvar(k)}"><div class="section-h"><h2>${esc(CATS[k].label)}</h2><span>${items.length} stories</span></div><div class="cards">${items.map(card).join("")}</div></section>`;
  }
  $("#feed").innerHTML = html;
  $("#prev").onclick = () => { heroIdx--; render(); };
  $("#next").onclick = () => { heroIdx++; render(); };
}

async function load() {
  $("#updated").textContent = "Loading the latest stories…";
  try {
    const r = await fetch("/api/news");
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    stories = j.stories || []; updatedAt = j.updatedAt;
    render();
  } catch (e) {
    $("#updated").textContent = "Couldn't load the feed. Check your connection and press Refresh.";
    if (!stories.length) $("#feed").innerHTML = "";
  }
}
$("#refresh").addEventListener("click", load);

(function header() {
  const now = new Date();
  const h = Number(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  $("#hello").textContent = `${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}, Arul`;
  $("#today").textContent = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
})();
renderChips();
load();
setInterval(() => stories.length && render(), 5 * 60 * 1000);
