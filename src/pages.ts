import { BASE, BLOG_DESCRIPTION, BLOG_TITLE, BLOG_URL, CTA_URL, FEED_TITLE, LANG, SITE_URL } from "./config.js";
import type { Post } from "./posts.js";
import { coverPath } from "./schema.js";
import type { Shell } from "./shell.js";

// Blog sayfalarının HTML'i. CSP (public/_headers): script yok, satır içi stil yok; her görünüm assets'teki CSS'te.
// Görünüm çekirdekteki alt sayfalarla aynı iskelet: üst çubuk + <main class="doc"> + footer (Ink & Lagoon).

export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface Assets {
  css: string; // ör. assets/blog-ABC123.css (BASE'e göre)
  font?: string;
  favicon: string;
}

export interface Ctx {
  assets: Assets;
  shell: Shell;
}

interface Meta {
  title: string;
  description: string;
  path: string; // ör. /blog/x
  type?: "website" | "article";
  published?: string;
  modified?: string;
  tags?: string[];
  noindex?: boolean;
  // Varsayılan: sayfanın kendi adresi. Yazıda bilgi bloğundaki canonical ile değişebilir.
  canonical?: string;
  // Paylaşım kartı görseli (kapak); varsa büyük kart (summary_large_image).
  image?: { url: string; alt: string };
}

export const postPath = (slug: string): string => `${BASE}/${slug}`;
export const tagPath = (tag: string): string => `${BASE}/tag/${tag}`;
const abs = (path: string): string => `${SITE_URL}${path}`;

// Kapak görseli: önerilen 1200×630 (paylaşım kartı oranı). Sayfada aynı oranda kırpılır (object-fit), düzen kaymaz.
const COVER_W = 1200;
const COVER_H = 630;
const coverImg = (p: Post, cls: string, eager = false): string =>
  p.cover && p.coverAlt
    ? `<img class="${cls}" src="${esc(coverPath(p.cover))}" alt="${esc(p.coverAlt)}" width="${COVER_W}" height="${COVER_H}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
    : "";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatDate = (iso: string): string => DATE_FMT.format(new Date(`${iso}T00:00:00Z`));
const time = (iso: string): string => `<time datetime="${iso}">${formatDate(iso)}</time>`;

function head(m: Meta, a: Assets): string {
  const url = m.canonical ?? abs(m.path);
  const lines = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    m.noindex ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${esc(url)}">`,
    `<meta name="theme-color" content="#FBFAF7">`,
    `<link rel="icon" href="${BASE}/${a.favicon}" type="image/svg+xml">`,
    ...(a.font ? [`<link rel="preload" href="${BASE}/${a.font}" as="font" type="font/woff2" crossorigin>`] : []),
    `<link rel="stylesheet" href="${BASE}/${a.css}">`,
    `<link rel="alternate" type="application/rss+xml" title="${esc(FEED_TITLE)}" href="${BLOG_URL}feed.xml">`,
    `<meta property="og:site_name" content="hanas.ai">`,
    `<meta property="og:locale" content="en_GB">`,
    `<meta property="og:type" content="${m.type ?? "website"}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    ...(m.image
      ? [`<meta property="og:image" content="${esc(m.image.url)}">`, `<meta property="og:image:alt" content="${esc(m.image.alt)}">`]
      : []),
    ...(m.published ? [`<meta property="article:published_time" content="${m.published}">`] : []),
    ...(m.modified ? [`<meta property="article:modified_time" content="${m.modified}">`] : []),
    ...(m.tags ?? []).map((t) => `<meta property="article:tag" content="${esc(t)}">`),
    `<meta name="twitter:card" content="${m.image ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    `<meta name="twitter:description" content="${esc(m.description)}">`,
    ...(m.image
      ? [`<meta name="twitter:image" content="${esc(m.image.url)}">`, `<meta name="twitter:image:alt" content="${esc(m.image.alt)}">`]
      : []),
  ];
  return lines.join("\n");
}

function layout(m: Meta, ctx: Ctx, main: string): string {
  return `<!doctype html>
<html lang="${LANG}">
<head>
${head(m, ctx.assets)}
</head>
<body>
${ctx.shell.header}
<main class="doc blog">
${main}
</main>
${ctx.shell.footer}
</body>
</html>
`;
}

const tagList = (tags: string[]): string =>
  tags.length ? `<ul class="post-tags" aria-label="Tags">${tags.map((t) => `<li><a class="tag" href="${tagPath(t)}">${esc(t)}</a></li>`).join("")}</ul>` : "";

const minutes = (p: Post): string => `${p.readingMinutes} min read`;

// Liste kartı: (varsa kapak), başlık, tarih, okuma süresi, açıklama, etiketler.
function card(p: Post, h: "h2" | "h3"): string {
  const cover = p.cover ? `<a class="post-card__cover" href="${postPath(p.slug)}" tabindex="-1" aria-hidden="true">${coverImg(p, "cover")}</a>\n` : "";
  return `<li class="post-card${p.cover ? " post-card--cover" : ""}">
${cover}<${h} class="post-card__title"><a href="${postPath(p.slug)}">${esc(p.title)}</a></${h}>
<p class="post-meta">${time(p.date)}<span aria-hidden="true"> · </span>${minutes(p)}</p>
<p class="post-card__desc">${esc(p.description)}</p>
${tagList(p.tags)}
</li>`;
}

const postList = (posts: Post[], h: "h2" | "h3" = "h2"): string => `<ul class="post-list">\n${posts.map((p) => card(p, h)).join("\n")}\n</ul>`;

export function indexPage(posts: Post[], ctx: Ctx): string {
  const body = posts.length
    ? postList(posts)
    : `<p class="blog-empty">There are no posts yet. Please check back soon.</p>`;
  return layout(
    { title: `${BLOG_TITLE} · hanas.ai`, description: BLOG_DESCRIPTION, path: `${BASE}/`, noindex: posts.length === 0 },
    ctx,
    `<header class="blog-head">
<h1>${esc(BLOG_TITLE)}</h1>
<p class="lead">${esc(BLOG_DESCRIPTION)}</p>
</header>
${body}`,
  );
}

export function tagPage(tag: string, posts: Post[], ctx: Ctx): string {
  const n = posts.length;
  return layout(
    {
      title: `Posts tagged “${tag}” · hanas.ai`,
      description: `${n} ${n === 1 ? "post" : "posts"} tagged “${tag}” on the hanas.ai blog for boutique hotel owners in the UK.`,
      path: tagPath(tag),
    },
    ctx,
    `<header class="blog-head">
<p class="label"><a href="${BASE}/">Blog</a></p>
<h1>Posts tagged “${esc(tag)}”</h1>
</header>
${postList(posts)}`,
  );
}

export function postPage(p: Post, related: Post[], ctx: Ctx): string {
  const updated = p.updated && p.updated !== p.date ? `<span aria-hidden="true"> · </span>Updated ${time(p.updated)}` : "";
  const rel = related.length
    ? `<nav class="related doc-sec" aria-labelledby="related-h">
<h2 id="related-h">Related posts</h2>
${postList(related, "h3")}
</nav>`
    : "";
  return layout(
    {
      title: `${p.title} · hanas.ai`,
      description: p.description,
      path: postPath(p.slug),
      type: "article",
      published: p.date,
      ...(p.updated ? { modified: p.updated } : {}),
      tags: p.tags,
      canonical: p.canonicalUrl,
      ...(p.cover && p.coverAlt ? { image: { url: abs(coverPath(p.cover)), alt: p.coverAlt } } : {}),
    },
    ctx,
    `<article class="post">
<header class="post-head">
<p class="label"><a href="${BASE}/">Blog</a></p>
<h1>${esc(p.title)}</h1>
<p class="post-meta">${time(p.date)}${updated}<span aria-hidden="true"> · </span>By ${esc(p.author)}<span aria-hidden="true"> · </span>${minutes(p)}</p>
${tagList(p.tags)}
</header>
${p.cover ? `<figure class="post-cover">${coverImg(p, "cover", true)}</figure>\n` : ""}<div class="prose">
${p.html}</div>
</article>
<aside class="post-cta" aria-labelledby="cta-h">
<h2 id="cta-h">Set up your receptionist</h2>
<p>Tell us your website. We set up a receptionist you can try from your browser, and nothing goes to guests until you ask us to switch it on. No card and no sales call needed.</p>
<div class="doc-actions"><a class="btn btn--primary" href="${CTA_URL}">Get early access</a></div>
</aside>
${rel}`,
  );
}

export function notFoundPage(ctx: Ctx): string {
  return layout(
    { title: `Page not found · hanas.ai`, description: "This blog page does not exist.", path: `${BASE}/404`, noindex: true },
    ctx,
    `<header class="blog-head">
<h1>Page not found</h1>
<p class="lead">This page does not exist or has moved.</p>
</header>
<div class="doc-actions"><a class="btn btn--primary" href="${BASE}/">See all posts</a><a class="btn btn--secondary" href="/">Go to hanas.ai</a></div>`,
  );
}

// RSS 2.0 (en-GB). pubDate RFC 822, tarih UTC gece yarısı.
export function rssXml(posts: Post[]): string {
  const x = (s: string) => esc(s);
  const rfc822 = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${x(p.title)}</title>
      <link>${abs(postPath(p.slug))}</link>
      <guid isPermaLink="true">${abs(postPath(p.slug))}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${x(p.description)}</description>
${p.tags.map((t) => `      <category>${x(t)}</category>`).join("\n")}
    </item>`.replace(/\n\n/g, "\n"),
    )
    .join("\n");
  const last = posts[0] ? `\n    <lastBuildDate>${rfc822(posts.map((p) => p.updated ?? p.date).sort().at(-1)!)}</lastBuildDate>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${x(FEED_TITLE)}</title>
    <link>${BLOG_URL}</link>
    <description>${x(BLOG_DESCRIPTION)}</description>
    <language>${LANG.toLowerCase()}</language>
    <atom:link href="${BLOG_URL}feed.xml" rel="self" type="application/rss+xml"/>${last}
${items}
  </channel>
</rss>
`;
}

// Blogun kendi sitemap'i (çekirdekteki robots.txt buna ayrı bir Sitemap: satırıyla işaret eder).
export function sitemapXml(entries: { path: string; lastmod?: string }[]): string {
  const urls = entries
    .map((e) => `  <url><loc>${abs(e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
