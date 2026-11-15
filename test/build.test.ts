import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { build } from "../src/build.js";
import { ContentError } from "../src/posts.js";
import { withBlogLink } from "../src/shell.js";
import { contentDir, outDir, post } from "./helpers.js";

const read = (dir: string, f: string) => readFileSync(join(dir, f), "utf8");

function site(files: Record<string, string>) {
  const out = outDir();
  const r = build({ contentDir: contentDir(files), outDir: out });
  return { out, r };
}

describe("derleme çıktısı", () => {
  const { out, r } = site({
    "guest-calls.md": post({ title: "Missed calls & bookings", date: "2026-11-10", updated: "2026-11-12", tags: ["guest-calls", "front-desk"] }),
    "late-arrivals.md": post({ title: "Late arrivals", date: "2026-11-05", tags: ["guest-calls"] }),
    "breakfast.md": post({ title: "Breakfast questions", date: "2026-11-01", tags: ["front-desk"] }),
    "secret-plan.md": post({ title: "Secret draft", date: "2026-11-11", tags: ["unreleased"], draft: true }),
  });

  it("liste, yazı, etiket, 404, RSS, sitemap ve _headers üretir; taslak hiçbir yerde yok", () => {
    expect(r.posts.map((p) => p.slug)).toEqual(["guest-calls", "late-arrivals", "breakfast"]);
    for (const f of ["index.html", "guest-calls.html", "tag/guest-calls.html", "tag/front-desk.html", "404.html", "feed.xml", "sitemap.xml", "_headers"]) {
      expect(existsSync(join(out, f)), f).toBe(true);
    }
    expect(existsSync(join(out, "secret-plan.html"))).toBe(false);
    expect(existsSync(join(out, "tag/unreleased.html"))).toBe(false);
    for (const f of r.files.filter((x) => /\.(html|xml)$/.test(x))) {
      const s = read(out, f);
      expect(s, f).not.toContain("secret-plan");
      expect(s, f).not.toContain("Secret draft");
      expect(s, f).not.toContain("unreleased");
    }
  });

  it("liste sayfası: yeniden eskiye, tarih, açıklama, okuma süresi, etiketler", () => {
    const html = read(out, "index.html");
    const order = ["guest-calls", "late-arrivals", "breakfast"].map((s) => html.indexOf(`href="/blog/${s}"`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(html).toContain('<time datetime="2026-11-10">10 November 2026</time>');
    expect(html).toContain("1 min read");
    expect(html).toContain('<a class="tag" href="/blog/tag/front-desk">front-desk</a>');
    expect(html).toContain('<link rel="canonical" href="https://gethanas.com/blog/">');
    expect(html).not.toContain("noindex");
  });

  it("yazı sayfası: meta etiketleri, güncellenme tarihi, yazar, CTA ve ilgili yazılar", () => {
    const html = read(out, "guest-calls.html");
    expect(html).toContain("<title>Missed calls &amp; bookings · hanas.ai</title>");
    expect(html).toContain('<link rel="canonical" href="https://gethanas.com/blog/guest-calls">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="article:published_time" content="2026-11-10">');
    expect(html).toContain('<meta property="article:modified_time" content="2026-11-12">');
    expect(html).toContain('<meta name="twitter:card" content="summary">');
    expect(html).toContain('Updated <time datetime="2026-11-12">12 November 2026</time>');
    expect(html).toContain("By The hanas.ai team");
    expect(html).toContain('<a class="btn btn--primary" href="/#early-access">Get early access</a>');
    const related = html.slice(html.indexOf('id="related-h"'));
    expect(related.indexOf("/blog/late-arrivals")).toBeGreaterThan(-1);
    expect(related.indexOf("/blog/breakfast")).toBeGreaterThan(-1);
    expect(related).not.toContain('href="/blog/guest-calls"');
  });

  it("CSP'ye uygun: script yok, satır içi stil yok", () => {
    for (const f of r.files.filter((x) => x.endsWith(".html"))) {
      const s = read(out, f);
      expect(s, f).not.toMatch(/<script|<style|\sstyle=/i);
    }
    expect(read(out, "_headers")).toMatch(/Content-Security-Policy: default-src 'none'; style-src 'self'/);
  });

  it("etiket sayfası yalnızca o etiketin yazılarını listeler", () => {
    const html = read(out, "tag/front-desk.html");
    expect(html).toContain("Posts tagged “front-desk”");
    expect(html).toContain('href="/blog/guest-calls"');
    expect(html).toContain('href="/blog/breakfast"');
    expect(html).not.toContain('href="/blog/late-arrivals"');
    expect(r.tags).toEqual(["front-desk", "guest-calls"]);
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
    expect(xml).toContain("<category>front-desk</category>");
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#39;)/);
  });

  it("sitemap: liste, yazılar (lastmod) ve etiket sayfaları", () => {
    const xml = read(out, "sitemap.xml");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/</loc><lastmod>2026-11-12</lastmod></url>");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/guest-calls</loc><lastmod>2026-11-12</lastmod></url>");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/breakfast</loc><lastmod>2026-11-01</lastmod></url>");
    expect(xml).toContain("<url><loc>https://gethanas.com/blog/tag/front-desk</loc></url>");
    expect(xml.match(/<url>/g)).toHaveLength(1 + 3 + 2);
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
