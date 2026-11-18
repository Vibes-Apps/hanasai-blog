import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { build } from "../src/build.js";
import { ContentError } from "../src/posts.js";
import { withBlogLink } from "../src/shell.js";
import { contentDir, outDir, post } from "./helpers.js";

const read = (dir: string, f: string) => readFileSync(join(dir, f), "utf8");
// JSON-LD veri blokları (VIB-72): çalıştırılmaz, CSP'nin script yasağına girmez. Diğer her şey script'siz kalmalı.
const LD_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const stripLd = (html: string): string => html.replace(LD_RE, "");
type LdNode = Record<string, unknown> & { "@type": string };
const ldGraph = (html: string): LdNode[] => [...html.matchAll(LD_RE)].flatMap((m) => JSON.parse(m[1]!)["@graph"] as LdNode[]);
const ldOf = (html: string, t: string): LdNode[] => ldGraph(html).filter((n) => n["@type"] === t);

function site(files: Record<string, string>) {
  const out = outDir();
  const r = build({ contentDir: contentDir(files), outDir: out });
  return { out, r };
}

describe("derleme çıktısı", () => {
  const { out, r } = site({
    "guest-calls.md": post({ title: "Missed calls & bookings", date: "2026-11-10", updated: "2026-11-12", tags: ["missed-calls", "hotels-and-bbs"] }),
    "late-arrivals.md": post({ title: "Late arrivals", date: "2026-11-05", tags: ["missed-calls", "ai-receptionist"] }),
    "breakfast.md": post({ title: "Breakfast questions", date: "2026-11-01", tags: ["hotels-and-bbs", "voice-ai"] }),
    "secret-plan.md": post({ title: "Secret draft", date: "2026-11-11", tags: ["product-news"], draft: true }),
  });

  it("liste, yazı, etiket, 404, RSS, sitemap ve _headers üretir; taslak hiçbir yerde yok", () => {
    expect(r.posts.map((p) => p.slug)).toEqual(["guest-calls", "late-arrivals", "breakfast"]);
    for (const f of ["index.html", "guest-calls.html", "tag/missed-calls.html", "tag/hotels-and-bbs.html", "404.html", "feed.xml", "sitemap.xml", "_headers"]) {
      expect(existsSync(join(out, f)), f).toBe(true);
    }
    expect(existsSync(join(out, "secret-plan.html"))).toBe(false);
    // Etiket sayfası hep var (butonlar hep görünür), ama taslağı göstermez: yazısı yoksa boş ve noindex.
    expect(read(out, "tag/product-news.html")).toContain("No posts in this topic yet");
    expect(read(out, "tag/product-news.html")).toContain('<meta name="robots" content="noindex">');
    for (const f of r.files.filter((x) => /\.(html|xml)$/.test(x))) {
      const s = read(out, f);
      expect(s, f).not.toContain("secret-plan");
      expect(s, f).not.toContain("Secret draft");
    }
  });

  it("liste sayfası: yeniden eskiye, tarih, açıklama, okuma süresi, etiketler", () => {
    const html = read(out, "index.html");
    const order = ["guest-calls", "late-arrivals", "breakfast"].map((s) => html.indexOf(`href="/blog/${s}"`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain('<time datetime="2026-11-10">10 November 2026</time>');
    expect(html).toContain("1 min read");
    expect(html).toContain('<a class="tag" href="/blog/tag/hotels-and-bbs">Hotels &amp; B&amp;Bs</a>');
    expect(html).toContain('<link rel="canonical" href="https://gethanas.com/blog/">');
    expect(html).not.toContain("noindex");
  });

  it("yazı sayfası: meta etiketleri, güncellenme tarihi, yazar, CTA ve ilgili yazılar", () => {
    const html = read(out, "guest-calls.html");
    expect(html).toContain("<title>Missed calls &amp; bookings · Hanas</title>");
    expect(html).toContain('<link rel="canonical" href="https://gethanas.com/blog/guest-calls">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="article:published_time" content="2026-11-10">');
    expect(html).toContain('<meta property="article:modified_time" content="2026-11-12">');
    expect(html).toContain('<meta name="twitter:card" content="summary">');
    expect(html).toContain('Updated <time datetime="2026-11-12">12 November 2026</time>');
    expect(html).toContain("By The Hanas team");
    expect(html).toContain('<a class="btn btn--primary" href="/#early-access">Get early access</a>');
    const related = html.slice(html.indexOf('id="related-h"'));
    expect(related.indexOf("/blog/late-arrivals")).toBeGreaterThan(-1);
    expect(related.indexOf("/blog/breakfast")).toBeGreaterThan(-1);
    expect(related).not.toContain('href="/blog/guest-calls"');
  });

  it("CSP'ye uygun: JSON-LD veri bloğu dışında script yok, satır içi stil yok", () => {
    for (const f of r.files.filter((x) => x.endsWith(".html"))) {
      const s = read(out, f);
      expect(stripLd(s), f).not.toMatch(/<script|<style|\sstyle=/i);
    }
    expect(read(out, "_headers")).toMatch(/Content-Security-Policy: default-src 'none'; style-src 'self'/);
  });

  it("etiket sayfası yalnızca o etiketin yazılarını listeler", () => {
    const html = read(out, "tag/hotels-and-bbs.html");
    expect(html).toContain("<h1>Hotels &amp; B&amp;Bs</h1>");
    expect(html).toContain('href="/blog/guest-calls"');
    expect(html).toContain('href="/blog/breakfast"');
    expect(html).not.toContain('href="/blog/late-arrivals"');
    expect(r.tags).toEqual(["ai-receptionist", "voice-ai", "hotels-and-bbs", "missed-calls"]);
  });

  it("RSS 2.0: en-gb, kaçışlı başlık, RFC 822 tarih, kalıcı guid, self link", () => {
    const xml = read(out, "feed.xml");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true);
    expect(xml).toContain("<language>en-gb</language>");
    expect(xml).toContain('<atom:link href="https://gethanas.com/blog/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(xml.match(/<item>/g)).toHaveLength(3);
    expect(xml).toContain("<title>Missed calls &amp; bookings</title>");
    expect(xml).toContain('<guid isPermaLink="true">https://gethanas.com/blog/guest-calls</guid>');
    expect(xml).toContain("<pubDate>Tue, 10 Nov 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Thu, 12 Nov 2026 00:00:00 GMT</lastBuildDate>");
    expect(xml).toContain("<category>Hotels &amp; B&amp;Bs</category>");
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#39;)/);
  });

  it("sitemap: liste, yazılar (lastmod) ve etiket sayfaları", () => {
    const xml = read(out, "sitemap.xml");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/</loc><lastmod>2026-11-12</lastmod></url>");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/guest-calls</loc><lastmod>2026-11-12</lastmod></url>");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/breakfast</loc><lastmod>2026-11-01</lastmod></url>");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/tag/hotels-and-bbs</loc></url>");
    expect(xml.match(/<url>/g)).toHaveLength(1 + 3 + 4);
  });

  it("CSS içerik hash'li adla, font ve favicon assets/ altında", () => {
    expect(r.files.some((f) => /^assets\/blog-[0-9a-f]{10}\.css$/.test(f))).toBe(true);
    expect(r.files.some((f) => /^assets\/.+\.woff2$/.test(f))).toBe(true);
    expect(read(out, "index.html")).toMatch(/<link rel="stylesheet" href="\/blog\/assets\/blog-[0-9a-f]{10}\.css">/);
  });

  it("footer'da Blog linki var (Company sütunu)", () => {
    expect(read(out, "index.html")).toMatch(/aria-label="Company">[\s\S]*?<a href="\/blog\/">Blog<\/a>/);
  });
});

describe("kapak görseli", () => {
  const { out } = site({
    "with-cover.md": post({ title: "With cover", date: "2026-11-10", cover: "/blog/images/example-cover.png", coverAlt: "A teal card", tags: ["ai-receptionist", "voice-ai"] }),
    "no-cover.md": post({ title: "No cover", date: "2026-11-09", tags: ["ai-receptionist", "voice-ai"] }),
  });

  it("yazının başında, düzen kaymadan (genişlik/yükseklik), alt metinle", () => {
    const html = read(out, "with-cover.html");
    expect(html).toContain(
      '<figure class="post-cover"><img class="cover" src="/blog/images/example-cover.png" alt="A teal card" width="1200" height="630" fetchpriority="high" decoding="async"></figure>',
    );
    expect(html.indexOf("post-cover")).toBeGreaterThan(html.indexOf("<h1>"));
    expect(html.indexOf("post-cover")).toBeLessThan(html.indexOf('class="prose"'));
  });

  it("paylaşım kartı: og:image tam adres, alt metin, büyük kart", () => {
    const html = read(out, "with-cover.html");
    expect(html).toContain('<meta property="og:image" content="https://gethanas.com/blog/images/example-cover.png">');
    expect(html).toContain('<meta property="og:image:alt" content="A teal card">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="https://gethanas.com/blog/images/example-cover.png">');
  });

  it("kapaksız yazıda og:image yok, küçük kart", () => {
    const html = read(out, "no-cover.html");
    expect(html).not.toContain("og:image");
    expect(html).toContain('<meta name="twitter:card" content="summary">');
    expect(html).not.toContain('class="post-cover"');
  });

  it("listede ve ilgili yazılarda küçük kapak (tembel yükleme)", () => {
    const index = read(out, "index.html");
    expect(index).toContain('<li class="post-card post-card--cover">');
    expect(index).toContain('<img class="cover" src="/blog/images/example-cover.png" alt="A teal card" width="1200" height="630" loading="lazy" decoding="async">');
    expect(read(out, "no-cover.html").slice(read(out, "no-cover.html").indexOf('id="related-h"'))).toContain("example-cover.png");
  });

  it("CSP'ye uygun kalır (satır içi stil yok)", () => {
    for (const f of ["index.html", "with-cover.html", "no-cover.html"]) expect(stripLd(read(out, f))).not.toMatch(/\sstyle=|<script/i);
  });
});

describe("canonical", () => {
  const { out, r } = site({
    "republished.md": post({ title: "Republished", date: "2026-11-10", canonical: "https://www.linkedin.com/pulse/original-article" }),
    "original.md": post({ title: "Original", date: "2026-11-09" }),
  });

  it("verilen adres canonical ve og:url olur", () => {
    const html = read(out, "republished.html");
    expect(html).toContain('<link rel="canonical" href="https://www.linkedin.com/pulse/original-article">');
    expect(html).toContain('<meta property="og:url" content="https://www.linkedin.com/pulse/original-article">');
    expect(read(out, "original.html")).toContain('<link rel="canonical" href="https://gethanas.com/blog/original">');
  });

  it("başka adresi gösteren yazı sitemap'e girmez, listede ve RSS'te kalır", () => {
    expect(r.posts).toHaveLength(2);
    const sitemap = read(out, "sitemap.xml");
    expect(sitemap).not.toContain("/blog/republished");
    expect(sitemap).toContain("/blog/original");
    expect(read(out, "index.html")).toContain('href="/blog/republished"');
    expect(read(out, "feed.xml")).toContain("<link>https://gethanas.com/blog/republished</link>");
  });

  it("canonical adresindeki & gibi karakterler kaçışlanır", () => {
    const { out: o } = site({ "q.md": post({ canonical: "https://example.com/a?x=1&y=2" }) });
    expect(read(o, "q.html")).toContain('<link rel="canonical" href="https://example.com/a?x=1&amp;y=2">');
  });
});

describe("canonical kendi blogumuzu gösterince yazı o adrese taşınır", () => {
  const { out, r } = site({
    "long-file-name-from-title.md": post({ title: "Moved", date: "2026-11-10", canonical: "https://gethanas.com/blog/short-address/" }),
    "stays.md": post({ title: "Stays", date: "2026-11-09" }),
  });

  it("yeni adreste yayınlanır, eski adres 301 ile yönlenir", () => {
    expect(existsSync(join(out, "short-address.html"))).toBe(true);
    expect(existsSync(join(out, "long-file-name-from-title.html"))).toBe(false);
    expect(read(out, "_redirects")).toBe("/blog/long-file-name-from-title /blog/short-address 301\n");
  });

  it("canonical, og:url, liste, RSS ve sitemap yeni adresi kullanır (sondaki / atılır)", () => {
    const html = read(out, "short-address.html");
    expect(html).toContain('<link rel="canonical" href="https://gethanas.com/blog/short-address">');
    expect(html).toContain('<meta property="og:url" content="https://gethanas.com/blog/short-address">');
    expect(read(out, "index.html")).toContain('href="/blog/short-address"');
    expect(read(out, "index.html")).not.toContain("long-file-name-from-title");
    expect(read(out, "feed.xml")).toContain("<link>https://gethanas.com/blog/short-address</link>");
    expect(read(out, "sitemap.xml")).toContain("<loc>https://gethanas.com/blog/short-address</loc>");
    expect(r.posts.find((p) => p.title === "Moved")).toMatchObject({ slug: "long-file-name-from-title", urlSlug: "short-address", selfCanonical: true });
  });

  it("taşınan yazı yoksa _redirects yazılmaz", () => {
    const { out: o } = site({ "a.md": post() });
    expect(existsSync(join(o, "_redirects"))).toBe(false);
  });

  it.each([
    ["iki yazı aynı adresi ister", { "a.md": post({ canonical: "https://gethanas.com/blog/same" }), "b.md": post({ canonical: "https://gethanas.com/blog/same/" }) }, "adres /blog/same başka bir yazıda da kullanılıyor"],
    ["yeni adres başka yazının adresi", { "a.md": post({ canonical: "https://gethanas.com/blog/b" }), "b.md": post() }, "adres /blog/b başka bir yazıda da kullanılıyor"],
    ["ayrılmış adres", { "a.md": post({ canonical: "https://gethanas.com/blog/tag" }) }, 'adres "tag" ayrılmış'],
  ])("%s → derleme durur", (_n, files, expected) => {
    expect(() => site(files as Record<string, string>)).toThrow(expected);
  });
});

describe("konu butonları ve etiket kutucukları", () => {
  const { out } = site({
    "a.md": post({ title: "Alpha", date: "2026-11-10", tags: ["pricing-and-costs", "hotels-and-bbs"] }),
    "b.md": post({ title: "Beta", date: "2026-11-09", tags: ["comparisons", "ai-receptionist"] }),
  });
  const topics = (html: string) => html.slice(html.indexOf('<nav class="topics"'), html.indexOf("</nav>", html.indexOf('<nav class="topics"')));

  it("liste sayfasında All + 10 etiket, sabit sırayla; All etkin", () => {
    const bar = topics(read(out, "index.html"));
    const labels = [...bar.matchAll(/<a class="topic[^"]*" href="[^"]+"[^>]*>([^<]+)<\/a>/g)].map((m) => m[1]);
    expect(labels).toEqual([
      "All", "AI Receptionist", "Voice AI", "Hotels &amp; B&amp;Bs", "Other Industries", "Pricing &amp; Costs", "Comparisons", "Missed Calls", "Legal &amp; Compliance", "Integrations &amp; PMS", "Product News",
    ]);
    expect(bar).toContain('<a class="topic topic--active" href="/blog/" aria-current="page">All</a>');
  });

  it("etiket sayfasında o etiket etkin, yalnızca onun yazıları; yazısı olmayan etiket sayfası noindex ve boş", () => {
    const html = read(out, "tag/pricing-and-costs.html");
    expect(topics(html)).toContain('<a class="topic topic--active" href="/blog/tag/pricing-and-costs" aria-current="page">Pricing &amp; Costs</a>');
    expect(html).toContain('href="/blog/a"');
    expect(html).not.toContain('href="/blog/b"');
    expect(html).toContain('<link rel="canonical" href="https://gethanas.com/blog/tag/pricing-and-costs">');
    const empty = read(out, "tag/voice-ai.html");
    expect(empty).toContain("No posts in this topic yet");
    expect(empty).toContain('<meta name="robots" content="noindex">');
    expect(read(out, "sitemap.xml")).not.toContain("/blog/tag/voice-ai");
  });

  it("yazı sayfasında bütün etiketler başlığın üstünde kutucuk", () => {
    const html = read(out, "a.html");
    const pills = '<ul class="post-topics" aria-label="Topics"><li><a class="topic-pill" href="/blog/tag/pricing-and-costs">Pricing &amp; Costs</a></li><li><a class="topic-pill" href="/blog/tag/hotels-and-bbs">Hotels &amp; B&amp;Bs</a></li></ul>';
    expect(html).toContain(pills);
    expect(html.indexOf(pills)).toBeLessThan(html.indexOf("<h1>"));
    expect(html).toContain('<meta property="article:tag" content="Pricing &amp; Costs">');
  });
});

describe("yayında yazı yokken", () => {
  it("liste noindex, sitemap boş, RSS geçerli ve öğesiz", () => {
    const { out, r } = site({ "only-draft.md": post({ draft: true }) });
    expect(r.posts).toEqual([]);
    expect(read(out, "index.html")).toContain('<meta name="robots" content="noindex">');
    expect(read(out, "sitemap.xml")).not.toContain("<url>");
    expect(read(out, "feed.xml")).not.toContain("<item>");
  });
});

describe("hatalı içerik", () => {
  it("derlemeyi durdurur ve önceki dist/ çıktısına dokunmaz", () => {
    const out = outDir();
    build({ contentDir: contentDir({ "ok.md": post() }), outDir: out });
    expect(() => build({ contentDir: contentDir({ "ok.md": post(), "bad.md": post({ description: "short" }) }), outDir: out })).toThrow(ContentError);
    expect(existsSync(join(out, "ok.html"))).toBe(true);
  });
});

describe("footer Blog linki", () => {
  const footer = '<footer class="foot"><nav class="foot__col" aria-label="Company"><h2 class="foot__h">Company</h2><ul><li><a href="/about">About</a></li><li><a href="/privacy">Privacy notice</a></li></ul></nav></footer>';
  it("About'tan sonra eklenir, zaten varsa iki kez eklenmez", () => {
    const once = withBlogLink(footer);
    expect(once).toContain('<li><a href="/about">About</a></li><li><a href="/blog/">Blog</a></li>');
    expect(withBlogLink(once)).toBe(once);
  });
  it("Company sütunu yoksa açık hata verir", () => {
    expect(() => withBlogLink("<footer></footer>")).toThrow(/Company/);
  });
});

// VIB-72 (çekirdek TECH_PLAN §28): BlogPosting + BreadcrumbList, liste ve etiket sayfalarında ItemList; marka "Hanas".
describe("yapılandırılmış veri (JSON-LD) ve marka", () => {
  const ORG = { "@type": "Organization", "@id": "https://gethanas.com/#org", name: "Hanas", url: "https://gethanas.com/", logo: "https://gethanas.com/logo-512.png" };
  const { out, r } = site({
    "with-cover.md": post({ title: "Cover </script> & co", date: "2026-11-10", updated: "2026-11-14", cover: "/blog/images/example-cover.png", coverAlt: "A teal card", tags: ["missed-calls", "hotels-and-bbs"] }),
    "plain.md": post({ title: "Plain", date: "2026-11-09", tags: ["missed-calls", "voice-ai"] }),
    "elsewhere.md": post({ title: "Elsewhere", date: "2026-11-08", canonical: "https://www.linkedin.com/pulse/original-article", tags: ["voice-ai", "ai-receptionist"] }),
  });

  it("yazı: BlogPosting (yazar ve yayıncı Organization Hanas, kapak, tarihler, canonical)", () => {
    const [bp] = ldOf(read(out, "with-cover.html"), "BlogPosting");
    expect(bp).toMatchObject({
      "@id": "https://gethanas.com/blog/with-cover#article",
      headline: "Cover </script> & co",
      url: "https://gethanas.com/blog/with-cover",
      datePublished: "2026-11-10",
      dateModified: "2026-11-14",
      image: "https://gethanas.com/blog/images/example-cover.png",
      author: ORG,
      publisher: ORG,
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://gethanas.com/blog/with-cover" },
      inLanguage: "en-GB",
      keywords: ["Missed Calls", "Hotels & B&Bs"],
    });
    expect(bp!.description).toBe(r.posts.find((p) => p.slug === "with-cover")!.description);
  });

  it("güncellenmeyen ve kapaksız yazıda dateModified ve image yok; dış canonical mainEntityOfPage olur", () => {
    const [plain] = ldOf(read(out, "plain.html"), "BlogPosting");
    expect(plain).not.toHaveProperty("dateModified");
    expect(plain).not.toHaveProperty("image");
    expect(ldOf(read(out, "elsewhere.html"), "BlogPosting")[0]!.mainEntityOfPage).toEqual({ "@type": "WebPage", "@id": "https://www.linkedin.com/pulse/original-article" });
  });

  it("yazıda BreadcrumbList: Home › Blog › yazı", () => {
    const [bc] = ldOf(read(out, "plain.html"), "BreadcrumbList");
    expect(bc!.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://gethanas.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://gethanas.com/blog/" },
      { "@type": "ListItem", position: 3, name: "Plain", item: "https://gethanas.com/blog/plain" },
    ]);
  });

  it("liste ve etiket sayfası: BreadcrumbList + ItemList, sayfadaki sırayla", () => {
    const index = read(out, "index.html");
    expect((ldOf(index, "BreadcrumbList")[0]!.itemListElement as unknown[]).length).toBe(2);
    const list = ldOf(index, "ItemList")[0]!;
    expect(list.numberOfItems).toBe(3);
    expect((list.itemListElement as { url: string }[]).map((x) => x.url)).toEqual(r.posts.map((p) => p.url));
    const tag = read(out, "tag/missed-calls.html");
    expect((ldOf(tag, "BreadcrumbList")[0]!.itemListElement as { item: string }[]).at(-1)!.item).toBe("https://gethanas.com/blog/tag/missed-calls");
    expect((ldOf(tag, "ItemList")[0]!.itemListElement as { url: string }[]).map((x) => x.url)).toEqual([
      "https://gethanas.com/blog/with-cover",
      "https://gethanas.com/blog/plain",
    ]);
  });

  it("noindex sayfalarda (boş etiket, 404) JSON-LD yok", () => {
    expect(read(out, "tag/product-news.html")).not.toContain("application/ld+json");
    expect(read(out, "404.html")).not.toContain("application/ld+json");
  });

  it('"<" kaçırılır: başlıktaki </script> veri bloğunu kapatamaz; blok geçerli JSON', () => {
    const html = read(out, "with-cover.html");
    const blocks = [...html.matchAll(LD_RE)];
    expect(blocks).toHaveLength(1);
    expect(blocks[0]![1]).not.toContain("<");
    expect(() => ldGraph(html)).not.toThrow();
  });

  it('marka: og:site_name ve başlıklar "Hanas"; şablonda "hanas.ai" yok', () => {
    for (const f of r.files.filter((x) => /\.(html|xml)$/.test(x))) {
      const s = read(out, f);
      expect(s, f).not.toMatch(/hanas\.ai/i);
      if (f.endsWith(".html")) expect(s, f).toContain('<meta property="og:site_name" content="Hanas">');
    }
    expect(read(out, "index.html")).toContain("<title>Blog · Hanas</title>");
    expect(read(out, "tag/missed-calls.html")).toContain("· Hanas blog</title>");
    expect(read(out, "feed.xml")).toContain("<title>Hanas blog</title>");
  });
});
